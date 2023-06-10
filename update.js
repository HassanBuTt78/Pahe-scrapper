const puppeteer = require('puppeteer-extra')
const mongoose = require('mongoose')
const fs = require('fs')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const { executablePath } = require('puppeteer')


let links;

mongoose.connect('mongodb+srv://Hassan:hassan@cluster0.wmrmexl.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => { console.log("db connected successfully"); read() }).catch(e => console.log(e))
const movieSchema = new mongoose.Schema({
    title: String,
    teaser: String,
    img: String,
    genre: Array,
    links: Object,
    devL: String
}, { versionKey: false })
const Movie = new mongoose.model('Movie', movieSchema)

const read = async () => {

    fs.readFile('./update.json', (err, data) => {
        if (err) {
            console.log(err)
        }
        else {
            links = JSON.parse(data)
            console.log(links)
            start()
        }
    })

}

const start = async () => {

    const browser = await puppeteer.launch({ headless: true, executablePath: executablePath() })
    const page = await browser.newPage()

    for (let link of links) {
        await page.goto(link)
        let imgg = await page.$eval('.imdbwp__img', el => el.src);
        let filter = { devL: link }
        let update = { img: imgg }
        const doc = await Movie.findOneAndUpdate(filter, update, {
            new: true
        });
        console.log(doc)
    }
console.log('******************************************** ENDED *************************************************')
} 