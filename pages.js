const puppeteer = require('puppeteer')
const fs = require('fs')
const mongoose = require('mongoose')

let allLinks = []


const start = async () => {
    let browser = await puppeteer.launch({ headless: true })
    let page = await browser.newPage()

    let pn = 1
    while (pn <= 70) {
        await page.goto(`https://pahe.li/movie-grid/?_page=${pn}`)
        let links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('._blank.pt-cv-href-thumbnail.pt-cv-thumb-default.cvplbd'), x => x.href)
        })
        allLinks = allLinks.concat(links)
        console.log(allLinks)
        pn++
    }


    console.log(allLinks)

    fs.writeFile("./links.json", JSON.stringify(allLinks), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
    

    await browser.close()
}





let db = mongoose.connect('mongodb://127.0.0.1:27017/MoviesTonight')
db.then(() => { console.log("DB connected"); start() })