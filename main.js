import path from "path";
import fs from "fs/promises";

import { firefox } from "playwright";
import slugify from "slugify";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { StopWatch } from "./StopWatch.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scanListingsPage(page, searchUrl, searchString) {
  await page.goto(searchUrl, {
    waitUntil: "domcontentloaded",
  });

  await page.type("#where", searchString);
  await page.click(".rui-search-button");

  await page.waitForSelector(".tiered-results--exact");

  return await page.$$eval(
    ".tiered-results--exact .results-card",
    ($elements) => {
      return $elements.map(($element) => {
        const price = $element.querySelector(".property-price").innerText;
        const $address = $element.querySelector(
          ".residential-card__address-heading"
        );
        const address = $address.innerText;
        const url = $address.querySelector("a").href;

        return { address, price, url };
      });
    }
  );
}

async function scanListingPage(page, listing) {
  page
    .goto(listing.url, {
      timeout: 0,
    })
    .catch(() => {});

  await delay(1000);

  await page.waitForSelector(".property-info__footer-content");

  const result = await page.$eval(
    ".property-info__footer-content p",
    ($element) => {
      return {
        available: $element.innerText.replace("Available ", ""),
      };
    }
  );

  return result;
}

function dateSlug({ date = null, utc = false } = {}) {
  if (!date) {
    date = new Date();
  }

  if (!utc) {
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() - offset * 60 * 1000);
  }

  const [yyyy, mm, dd, hh, MM, ss, _] = date.toISOString().split(/[\-T\:\.]/);
  return `${yyyy}-${mm}-${dd}-${hh}-${MM}-${ss}`;
}

async function getListings({
  searchUrl,
  searchString,
  showUnitSummary = true,
} = {}) {
  const browser = await firefox.launch({
    headless: true,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  const listings = await scanListingsPage(page, searchUrl, searchString);

  // show units
  if (showUnitSummary) {
    const units = listings.map(({ address, url }) => {
      const unit = address.split("/")[0].trim();
      return unit;
    });

    console.log(units);
  }

  // get & show listing availability
  for (let listing of listings) {
    const extra = await scanListingPage(page, listing);

    listing = {
      ...listing,
      ...extra,
    };

    console.log(listing);
  }

  await browser.close();

  return listings;
}

async function dumpResults({ listings, searchString, outputRootDir }) {
  const searchSlug = slugify(searchString);
  const outputDir = path.join(outputRootDir, searchSlug);
  const outputFile = path.join(outputDir, `${dateSlug()}.json`);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(listings, null, 2));

  return outputFile;
}

function initialiseCLI() {
  const yarg = yargs(hideBin(process.argv));

  return yarg
    .scriptName("property-bot")
    .positional("search-string", {
      type: "string",
      describe:
        'the string to use for the property search, e.g. "42 wallaby way, sydney 2000"',
    })
    .option("o", {
      alias: "output-dir",
      describe:
        "the directory in which to store the search results, e.g. results/",
      type: "string",
    })
    .option("u", {
      alias: "search-url",
      default: "https://www.realestate.com.au/rent/",
      describe: "the url of the search page",
      type: "string",
    })
    .option("show-unit-summary", {
      boolean: true,
      default: true,
      describe: "show a summary of the unit numbers before showing the full results, useful when searching in one apartment building"
    })
    .help().argv;
}

async function main() {
  const stopWatch = new StopWatch();

  const options = initialiseCLI();

  const searchString = options._[0];
  const {searchUrl, showUnitSummary} = options;

  const listings = await getListings({
    searchUrl,
    searchString,
    showUnitSummary,
  });

  if (options.outputDir) {
    const outputFile = await dumpResults({
      listings,
      searchString,
      outputRootDir: options.outputDir,
    });

    console.log(`Wrote results to ${outputFile}`);
  }

  console.log();
  console.log(`Finished in ${stopWatch.getElapsed()}s`);

  process.exit();
}

main();
