const puppeteer = require('puppeteer-extra')
const mongoose = require('mongoose')
const fs = require('fs')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const { executablePath } = require('puppeteer')

const movies = []
let links = []

mongoose.connect('mongodb://127.0.0.1:27017/Movies', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => { console.log("db connected successfully"); read() }).catch(e => console.log(e))
const movieSchema = new mongoose.Schema({
    title: String,
    teaser: String,
    genre: Array,
    link: String
})
const Movie = new mongoose.model('Movie', movieSchema)

const read = () => {

    fs.readFile('./links.json', (err, data) => {
        if (err) {
            console.log(err)
        }
        else {
            links = JSON.parse(data)
            start()
        }
    })
}


const start = async () => {

    let browser = await puppeteer.launch({ headless: true, executablePath: executablePath() })

    // ----------------------------------------------------------------------------------------------------------
    const getMega = async (url) => {

        try {

            console.log("url found", url)
            let page2 = await browser.newPage()

            await page2.goto(url)
            console.log("5%")
            await page2.waitForTimeout(8000)
            console.log("10%", page2.url())
            await page2.waitForSelector('#soralink-human-verif-main', { visible: true })
            await page2.click('#soralink-human-verif-main')
            console.log("20%", page2.url())


            await page2.waitForTimeout(9000)
            console.log("30%", page2.url())
            console.log("40%", page2.url())
            await page2.click('#generater')
            console.log("60%", page2.url())


            await page2.waitForTimeout(7000)
            console.log("70%", page2.url())

            const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
            await page2.click('#showlink')
            const newpage = await newPagePromise;
            page2.waitForTimeout(4000)
            await page2.close()
            console.log('page2 closed')
            // await newpage.setDefaultNavigationTimeout(0);
            console.log("80%", newpage.url())

            await newpage.waitForTimeout(3000)
            console.log("85%", newpage.url())
            // newpage.screenshot({path: 'screenshot.png',fullPage: true})

            await newpage.waitForSelector('.btn.btn-primary.btn-xs', { visible: true })

            console.log("90%")

            await newpage.click('.btn.btn-primary.btn-xs')

            const page3 = await newPagePromise;


            let megaLinkf = await page3.evaluate(() => document.location.href)
            console.log("100%")

            return megaLinkf
        }
        catch (err) {
            console.log(err)
        }


    }
    // ----------------------------------------------------------------------------------------------------------



    let page = await browser.newPage()

    for (let link of links) {
        try {

            await page.goto(link)
            let data = await page.evaluate(() => {
                return {
                    title: document.querySelector('.name > span:nth-child(1)').innerHTML,
                    teaser: document.querySelector('.imdbwp__teaser').innerHTML,
                    genre: Array.from(document.querySelectorAll('.post-cats > a'), x => x.innerHTML),
                    link: document.querySelectorAll('.shortc-button.small.red')[0].href
                }
            });
            let finalData = new Movie({
                title: data.title,
                teaser: data.teaser,
                genre: data.genre,
                link: await getMega(data.link)
            })
            let result = await finalData.save()
            console.log(result)
            console.log(data)
        }
        catch (e) {
            console.log(e)
        }

    }



    await browser.close()
}