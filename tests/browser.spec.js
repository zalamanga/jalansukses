import { test as base, expect } from '@playwright/test';

const pages = ['index.html', 'tentangkami.html', 'layanan.html', 'layananaplikasi.html', 'layananmanajemen.html', 'layananwebsite.html', 'layananmarketing.html', 'berita.html', 'artikel.html', 'hubungikami.html'];

const test = base.extend({
  networkAudit: [async ({ context, page, baseURL }, use, testInfo) => {
    const origin = new URL(baseURL).origin;
    const errors = [];
    const external = [];
    const writes = [];
    const missing = [];
    const failed = [];
    page.on('pageerror', (error) => errors.push(error.stack || error.message));
    context.on('requestfailed', (request) => {
      const url = new URL(request.url());
      if (url.origin === origin) failed.push({ path: url.pathname, error: request.failure()?.errorText });
    });
    context.on('response', (response) => {
      if (new URL(response.url()).origin === origin && response.status() >= 400) missing.push(`${response.status()} ${response.url()}`);
    });
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!['http:', 'https:'].includes(url.protocol)) return route.continue();
      if (!['GET', 'HEAD'].includes(request.method())) {
        writes.push(`${request.method()} ${url.href}`);
        return route.abort('blockedbyclient');
      }
      if (url.origin !== origin) {
        external.push(url.href);
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    await use({ errors, external, writes, missing, failed });
    await testInfo.attach('network-audit', {
      body: JSON.stringify({ errors, blockedExternalRequests: [...new Set(external)], blockedWrites: writes, missingLocalResources: [...new Set(missing)], failedLocalRequests: failed }, null, 2),
      contentType: 'application/json',
    });
    expect(errors, 'Uncaught browser errors').toEqual([]);
    expect(missing, 'Missing local resources').toEqual([]);
    expect(failed, 'Unexpected failed local requests').toEqual([]);
    expect(writes, 'No contact submission or other write may be attempted').toEqual([]);
  }, { auto: true }],
});

async function openPage(page, pathname) {
  await page.goto(`/${pathname}`, { waitUntil: 'load' });
  await expect(page.locator('header nav')).toBeVisible();
  const matchingLinks = await page.locator('#nav-menu a[href]').evaluateAll((links, destination) => links
    .filter((link) => new URL(link.href).pathname.split('/').pop() === destination).length, pathname);
  await expect(page.locator('#nav-menu a[aria-current="page"]')).toHaveCount(matchingLinks);
}

async function assertNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.width + 1);
  expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.width + 1);
}

function dropdown(page, index) {
  const item = page.locator('.dropdown__item').nth(index);
  return { item, button: item.locator('.dropdown__button'), panel: item.locator('.dropdown__container') };
}

for (const pathname of pages) {
  test(`${pathname}: local resources, images, navigation and inactive forms`, async ({ page }) => {
    await openPage(page, pathname);
    const current = page.locator('#nav-menu a[aria-current="page"]');
    for (const link of await current.all()) expect(new URL(await link.getAttribute('href'), page.url()).pathname).toBe(`/${pathname}`);
    const duplicateIDs = await page.locator('[id]').evaluateAll((elements) => {
      const seen = new Set();
      return elements.map((element) => element.id).filter((id) => seen.has(id) || !seen.add(id));
    });
    expect(duplicateIDs).toEqual([]);
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0), {
        message: `Image failed to load: ${await image.getAttribute('src')}`,
      }).toBe(true);
    }
    for (const form of await page.locator('form').all()) {
      await expect(form.locator('input, textarea, select, button')).not.toHaveCount(0);
      for (const control of await form.locator('input, textarea, select, button').all()) await expect(control).toBeDisabled();
      expect(await form.getAttribute('action')).toBeNull();
      expect(await form.getAttribute('method')).toBeNull();
      const notice = form.locator('.form-notice, [role="status"]');
      await expect(notice).toBeVisible();
      await expect(notice).toContainText(/(?:belum|tidak)/i);
    }
    await assertNoOverflow(page);
  });

  test(`${pathname}: fits 320, 390, 768, 1118 and 1280px viewports`, async ({ page }) => {
    await openPage(page, pathname);
    const toggle = page.locator('#nav-toggle');
    for (const width of [320, 390, 768, 1118, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await assertNoOverflow(page);
      if (width < 1280) {
        await expect(toggle).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#nav-menu')).toHaveClass(/show-menu/);
        await assertNoOverflow(page);
        await page.keyboard.press('Escape');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      } else {
        await expect(toggle).toBeHidden();
        await expect(page.locator('#nav-menu')).not.toHaveClass(/show-menu/);
      }
    }
  });
}

test('the directory root marks Beranda as the current navigation item', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const current = page.locator('#nav-menu a[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('href', 'index.html');
});

test('mobile navigation supports Enter, Space, Escape and desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, 'index.html');
  const toggle = page.locator('#nav-toggle');
  await expect(toggle).toHaveAttribute('type', 'button');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeHidden();
  await expect(page.locator('#nav-menu')).not.toHaveClass(/show-menu/);
});

test('the mobile services dropdown supports keyboard toggling and local navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, 'index.html');
  await page.locator('#nav-toggle').click();
  const first = dropdown(page, 0);
  await expect(first.button).toHaveAttribute('type', 'button');
  await first.button.focus();
  await page.keyboard.press('Enter');
  await expect(first.button).toHaveAttribute('aria-expanded', 'true');
  await expect(first.item).toHaveClass(/show-dropdown/);
  await expect(first.panel).toBeVisible();
  await page.keyboard.press('Space');
  await expect(first.button).toHaveAttribute('aria-expanded', 'false');
  await expect(first.panel).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(first.button).toHaveAttribute('aria-expanded', 'true');
  const destination = first.panel.locator('a[href="layananaplikasi.html"]');
  await expect(destination).toBeVisible();
  await destination.click();
  await expect(page).toHaveURL(/\/layananaplikasi\.html$/);
  await expect(page.locator('#nav-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('desktop dropdowns expose keyboard controls and close on Escape or outside click', async ({ page }) => {
  await openPage(page, 'index.html');
  const first = dropdown(page, 0);
  await first.button.focus();
  await page.keyboard.press('Enter');
  await expect(first.button).toHaveAttribute('aria-expanded', 'true');
  await expect(first.panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(first.button).toHaveAttribute('aria-expanded', 'false');
  await expect(first.button).toBeFocused();
  await page.keyboard.press('Space');
  await expect(first.button).toHaveAttribute('aria-expanded', 'true');
  await page.locator('footer').click({ position: { x: 10, y: 10 } });
  await expect(first.button).toHaveAttribute('aria-expanded', 'false');
});

test('resizing an open mobile dropdown moves focus out of its hidden panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, 'index.html');
  await page.locator('#nav-toggle').click();
  const services = dropdown(page, 0);
  await services.button.click();
  const link = services.panel.locator('a[href="layananaplikasi.html"]');
  await link.focus();
  await expect(link).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(services.panel).toBeHidden();
  await expect(services.button).toHaveAttribute('aria-expanded', 'false');
  await expect(services.button).toBeFocused();
});

test('semantic section headings retain their styles and service labels fill their image cards', async ({ page }) => {
  await openPage(page, 'index.html');
  const aboutHeading = page.locator('.about-title h2');
  await expect(aboutHeading).toHaveCSS('color', 'rgb(1, 113, 67)');
  await expect(aboutHeading).toHaveCSS('font-size', '36px');
  await expect(aboutHeading).toHaveCSS('font-weight', '600');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(aboutHeading).toHaveCSS('font-size', '28px');

  await page.setViewportSize({ width: 1280, height: 900 });
  await openPage(page, 'tentangkami.html');
  const contactHeading = page.locator('.contact h2');
  await expect(contactHeading).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(contactHeading).toHaveCSS('margin-bottom', '40px');

  await openPage(page, 'layanan.html');
  const labels = page.locator('.service-card .layer h3');
  await expect(labels).toHaveCount(4);
  for (const label of await labels.all()) {
    await expect(label).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(label).toHaveCSS('opacity', '1');
    const widths = await label.evaluate((element) => ({
      label: element.getBoundingClientRect().width,
      panel: element.closest('.layer').getBoundingClientRect().width,
    }));
    expect(Math.abs(widths.label - widths.panel), JSON.stringify(widths)).toBeLessThanOrEqual(1);
  }
});
