import { firefox } from "playwright";

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

async function main() {
  const stopWatch = new StopWatch();

  const browser = await firefox.launch({
    headless: true,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // TODO: move to cli arg (default)
  const searchUrl = "https://www.realestate.com.au/rent/";
  // TODO: add cli option lib
  const searchString = process.argv[2];

  const listings = await scanListingsPage(page, searchUrl, searchString);

  // TODO: move to cli option
  // show units
  const units = listings.map(({ address, url }) => {
    const unit = address.split("/")[0].trim();
    return unit;
  });

  console.log(units);

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

  // TODO: write output data to file

  console.log(`Finished in ${stopWatch.getElapsed()}s`);

  process.exit();
}

main();
