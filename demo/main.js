#!/usr/bin/env node
// Simulate the program for a demo
// To run the simulation:
//  1. In package.json, overwrite bin.propertybot="./demo/main.js"
//  2. `npm uninstall -g`
//  3. `npm install -g`
//  4. `propertybot ...args...` will now run the simulated demo

import { StopWatch } from "../StopWatch.js";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const expectedCommand = `propertybot "42 wallaby way, sydney 2000" -o results/`;
const streetAddress = "42 Wallaby Way, Sydney"
const listingUrlBase = "https://www.realestate.com.au/property-apartment-nsw-sydney-42999"

const listings = [
    {
        address: `31/${streetAddress}`,
        price: '$530 Weekly',
        url: `${listingUrlBase}1234`,
        available: '3 Feb 2022'
      },
      {
        address: `27/${streetAddress}`,
        price: '$550 Weekly',
        url: `${listingUrlBase}2345`,
        available: 'now'
      },
      {
        address: `3/${streetAddress}`,
        price: '$450 Weekly',
        url: `${listingUrlBase}3456`,
        available: '18 Feb 2022'
      },
      {
        address: `55/${streetAddress}`,
        price: '$470 Weekly',
        url: `${listingUrlBase}4567`,
        available: 'now'
      },
      {
        address: `12/${streetAddress}`,
        price: '$530 Weekly',
        url: `${listingUrlBase}5678`,
        available: 'now'
      }
]

const units = listings.map(({address}) => address.split("/")[0]);

const stopWatch = new StopWatch();

await delay(1500);
console.log("Unit summary:")
console.log(units);
console.log();

console.log("Listing info:")
for (const listing of listings) {
    await delay(800);
    console.log(listing);
}
console.log()

console.log("Wrote results to results/42-wallaby-way-sydney-2000/2022-02-02-09-19-47.json")
console.log();


console.log(`Finished in ${stopWatch.getElapsed()}s`);