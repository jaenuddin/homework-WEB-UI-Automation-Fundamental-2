const fs = require('node:fs');
const path = require('node:path');
const pixelmatch = require('pixelmatch').default;
const { PNG } = require('pngjs');

const projectRoot = path.resolve(__dirname, '..', '..');
const baselineDir = path.join(projectRoot, 'visual_baselines');
const actualDir = path.join(projectRoot, 'artifacts', 'screenshots');
const updateSnapshots = process.env.UPDATE_SNAPSHOTS === '1';

async function assertVisualMatch(driver, snapshotName, assert) {
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.mkdirSync(actualDir, { recursive: true });

  const screenshot = Buffer.from(await driver.takeScreenshot(), 'base64');
  const actualPath = path.join(actualDir, `${snapshotName}.png`);
  const baselinePath = path.join(baselineDir, `${snapshotName}.png`);
  fs.writeFileSync(actualPath, screenshot);

  if (updateSnapshots) {
    fs.copyFileSync(actualPath, baselinePath);
    return;
  }

  assert.ok(
    fs.existsSync(baselinePath),
    `Baseline tidak ditemukan: ${baselinePath}. Buat dengan: npm run test:update-snapshots`,
  );

  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const actual = PNG.sync.read(screenshot);
  assert.strictEqual(actual.width, baseline.width, 'Lebar screenshot berubah');
  assert.strictEqual(actual.height, baseline.height, 'Tinggi screenshot berubah');

  const diff = new PNG({ width: actual.width, height: actual.height });
  const differingPixels = pixelmatch(
    baseline.data,
    actual.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: 0.1, includeAA: false },
  );
  const diffRatio = differingPixels / (actual.width * actual.height);
  const maxDiffRatio = 0.01;

  if (diffRatio > maxDiffRatio) {
    const diffPath = path.join(actualDir, `${snapshotName}-diff.png`);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    assert.fail(
      `Visual regression ${snapshotName}: ${(diffRatio * 100).toFixed(2)}% piksel berbeda ` +
      `(batas ${(maxDiffRatio * 100).toFixed(2)}%). Aktual: ${actualPath}; diff: ${diffPath}`,
    );
  }
}

module.exports = { assertVisualMatch };
