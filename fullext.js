const puppeteer = require('puppeteer-extra')
const mongoose = require('mongoose')
const fs = require('fs')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const { executablePath } = require('puppeteer')

const movies = []
let links = []
let count = 0

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => { console.log("db connected successfully"); read() }).catch(e => console.log(e))
const movieSchema = new mongoose.Schema({
    title: String,
    teaser: String,
    img: String,
    genre: Array,
    links: Object,
    devL: String
}, { versionKey: false })
const Movie = new mongoose.model('Movie', movieSchema)

const read = () => {

    fs.readFile('./count.json', (err, data) => {
        if (err) {
            console.log(err)
        }
        else {
            count = JSON.parse(data).Count
            console.log('count is ', count)
            read2()
        }
    })
}
const read2 = () => {

    fs.readFile('./links.json', (err, data) => {
        if (err) {
            console.log(err)
        }
        else {
            links = JSON.parse(data)
            links.splice(0, count)
            console.log(links)
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
            await disableCSS(page2)
            await page2.evaluateOnNewDocument(() => {
                // Modify the behavior of setTimeout and setInterval to make them run faster
                const originalSetTimeout = window.setTimeout;
                const originalSetInterval = window.setInterval;

                window.setTimeout = (fn, delay, ...args) => {
                    return originalSetTimeout(fn, delay / 20, ...args); // Speed up setTimeout by dividing the delay by 10
                };

                window.setInterval = (fn, interval, ...args) => {
                    return originalSetInterval(fn, interval / 20, ...args); // Speed up setInterval by dividing the interval by 10
                };
            });




            await page2.goto(url)
            console.log("5%")
            await page2.waitForTimeout(7000)
            console.log("10%", page2.url())
            await page2.waitForSelector('#soralink-human-verif-main', { visible: true })
            await page2.click('#soralink-human-verif-main')
            console.log("20%", page2.url())


            await page2.waitForTimeout(2000)
            console.log("30%", page2.url())
            console.log("40%", page2.url())
            await page2.waitForSelector('#generate')
            await page2.click('#generater')
            console.log("60%", page2.url())


            await page2.waitForTimeout(1000)
            console.log("70%", page2.url())

            // const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
            // await page2.click('#showlink')
            // const newpage = await newPagePromise;
            const newpage = await popup(page2, browser, '#showlink')
            page2.waitForTimeout(500)
            await page2.close()
            console.log('page2 closed')
            console.log("80%", page2.url())

            await newpage.waitForTimeout(2000)
            console.log("85%", newpage.url())

            try {
                await newpage.waitForSelector('.btn.btn-primary.btn-xs', { visible: true })
            } catch (error) {
                console.log(error)
            }

            console.log("90%")

            // await newpage.click('.btn.btn-primary.btn-xs')\
            // await newpage.waitForTimeout(1000)


            const page3 = await popup(newpage, browser, ".btn.btn-primary.btn-xs")

            let megaLinkf = await page3.evaluate(() => document.location.href)
            console.log("100%")

            try {

                await page3.close()
                await newpage.close()
            }
            catch (e) {
                console.log("XXXXXX any page is already closed XXXXXX")
            }
            console.log(megaLinkf, '\n -------------------------------------------------------------------------')

            return megaLinkf
        }
        catch (err) {
            console.log(err)
        }


    }
    // ----------------------------------------------------------------------------------------------------------



    let page = await browser.newPage()
    await disableCSS(page)

    for (let link of links) {
        try {

            await page.goto(link)
            let data = await page.evaluate(() => {
                return {
                    title: document.querySelector('.name > span:nth-child(1)').innerHTML,
                    teaser: document.querySelector('.imdbwp__teaser').innerHTML,
                    img: document.querySelector('.imdbwp__img').src,
                    genre: Array.from(document.querySelectorAll('.post-cats > a'), x => x.innerHTML),
                    link: Array.from(document.querySelectorAll('.shortc-button.small.red'), x => x.href)
                }
            });

            data.link.splice(3)
            console.log(data.link)

            let temp = []
            for (let link of data.link) {
                await new Promise((res, rej) => {
                    res(getMega(link))
                }).then((link) => { temp.push(link) })
            }

            let finalLinks = pack(temp)


            let finalData = new Movie({
                title: data.title,
                teaser: data.teaser,
                img: data.img,
                genre: data.genre,
                links: finalLinks,
                devL: link
            })
            let result = await finalData.save()
            increaseCount()
            console.log(result)
        }
        catch (e) {
            console.log(e)
        }

    }



    await browser.close()
}

const increaseCount = () => {
    count++
    fs.writeFile('./count.json', JSON.stringify({ Count: count }), (err) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log('Count Increased')
        }
    })
}


const pack = (array) => {
    let give = new Object
    let i = 0
    while (i < array.length) {
        if (i == 0) {
            give.mediumQuality = array[i]
        }
        if (i == 1) {
            give.highQuality1 = array[i]
        }
        if (i == 2) {
            give.highQuality2 = array[i]
        }
        i++
    }
    return give
}

const disableCSS = async (page) => {
    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
}

const popup = async (_page, _browser, selector) => {
    try {
        let pageTarget = _page.target(); //save this to know that this was the opener
        await _page.click(selector); //click on a link
        let newTarget = await _browser.waitForTarget(target => target.opener() === pageTarget, { timeout: 2000 }); //check that you opened this page, rather than just checking the url
        let newPage = await newTarget.page(); //get the page object
        return newPage
    }
    catch (e) {
        return _page
    }
}


setTimeout((function() {
    console.log('-------------------------------------------------------- RESTARTING --------------------------------------------------------')
    return process.exit();
}), 900000);
