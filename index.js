const puppeteer = require('puppeteer-extra')  
const StealthPlugin = require('puppeteer-extra-plugin-stealth') 
puppeteer.use(StealthPlugin())
const {executablePath} = require('puppeteer')
var prompt = require('prompt-sync')();



const go = async (url) => {
    let browser = await puppeteer.launch({ headless: true, executablePath: executablePath() })
    let page = await browser.newPage()
    // page.setDefaultNavigationTimeout(0)
    await page.goto(url)

    let links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('ul.timeline > li > div > h2 > a'), x => x.href)
    });

    let titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('ul.timeline > li > div > h2 > a'), x => x.innerHTML)
    });

    let i = 0
    for (let link of titles) {
        console.log(i, link)
        i++
    }


    await page.close()


    const getMega = async (url) => {
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

    const proceed2one = async () => {
        let movie = prompt('Choose one movie! (type its number)')
        if (movie >= 0 && movie < links.length) {

            page = await browser.newPage()
            page.setDefaultNavigationTimeout(0)

            await page.goto(links[movie])
            let data = await page.evaluate(() => {

                return {
                    title: document.querySelector('.name > span:nth-child(1)').innerHTML,
                    link: document.querySelectorAll('.shortc-button.small.red')[0].href
                }
            });
            await page.close()
            console.log("This link leads to mega: ",data.link)
            let finalData = {
                title: data.title,
                link: await getMega(data.link)
            }

            console.log('Here is link for', finalData.title, '\n => ', finalData.link)
            await browser.close()
        }
        else {
            console.error('Invalid Movie Number')
            proceed2one()
        }

    }

    proceed2one()

}


let query = prompt('Write the name of movie you want!  =>')
query = query.replaceAll(' ', '+')


go(`https://pahe.li/?s=${query}`)
// document.querySelectorAll('.shortc-button.small.red')