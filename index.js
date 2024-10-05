const axios = require('axios');
const fs = require('fs');
const path = require('path');

// List of URLs
const urls = [
    "https://source.unsplash.com/800x600/?zermatt",
    "https://source.unsplash.com/800x600/?banff",
    "https://source.unsplash.com/800x600/?chamonix",
    "https://source.unsplash.com/800x600/?aspen",
    "https://source.unsplash.com/800x600/?queenstown",
    "https://source.unsplash.com/800x600/?cortina",
"https://source.unsplash.com/800x600/?whistler",
"https://source.unsplash.com/800x600/?st_moritz",
"https://source.unsplash.com/800x600/?vail",
"https://source.unsplash.com/800x600/?garmisch",
"https://source.unsplash.com/800x600/?interlaken",
"https://source.unsplash.com/800x600/?leavenworth",
"https://source.unsplash.com/800x600/?telluride",
"https://source.unsplash.com/800x600/?stowe",
"https://source.unsplash.com/800x600/?wengen",
"https://source.unsplash.com/800x600/?grindelwald",
"https://source.unsplash.com/800x600/?zakopane",
"https://source.unsplash.com/800x600/?hallstatt",
"https://source.unsplash.com/800x600/?kitzbuhel",
"https://source.unsplash.com/800x600/?murren",
"https://source.unsplash.com/800x600/?zell_am_see",
"https://source.unsplash.com/800x600/?bled",
"https://source.unsplash.com/800x600/?morzine",
"https://source.unsplash.com/800x600/?mayrhofen",
"https://source.unsplash.com/800x600/?gstaad",
"https://source.unsplash.com/800x600/?soldeu",
"https://source.unsplash.com/800x600/?bansko",
"https://source.unsplash.com/800x600/?bariloche",
"https://source.unsplash.com/800x600/?pucon",
"https://source.unsplash.com/800x600/?courmayeur",
"https://source.unsplash.com/800x600/?huaraz",
"https://source.unsplash.com/800x600/?bariloche",
"https://source.unsplash.com/800x600/?manali",
"https://source.unsplash.com/800x600/?leh",
"https://source.unsplash.com/800x600/?thredbo",
"https://source.unsplash.com/800x600/?sapa",
"https://source.unsplash.com/800x600/?cervinia",
"https://source.unsplash.com/800x600/?niseko",
"https://source.unsplash.com/800x600/?queenstown",
"https://source.unsplash.com/800x600/?wanaka",
"https://source.unsplash.com/800x600/?hakuba",
"https://source.unsplash.com/800x600/?auli",
"https://source.unsplash.com/800x600/?gulmarg",
"https://source.unsplash.com/800x600/?shangri-la",
"https://source.unsplash.com/800x600/?aspen",
"https://source.unsplash.com/800x600/?big_sky",
"https://source.unsplash.com/800x600/?jackson",
"https://source.unsplash.com/800x600/?taos",
"https://source.unsplash.com/800x600/?durango",
"https://source.unsplash.com/800x600/?lake_louise",
];

// Directory to save images
const directory = path.join(__dirname, 'src', 'assets', 'mountain_photos');

// Ensure directory exists
if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
}

// Download images
async function downloadImages() {
    try {
        for (let idx = 0; idx < urls.length; idx++) {
            const url = urls[idx];
            const response = await axios.get(url, { responseType: 'stream' });
            const filePath = path.join(directory, `mountain_town_${idx + 1}.jpg`);
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            console.log(`Downloading ${filePath}...`);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }
        console.log("Images downloaded successfully.");
    } catch (error) {
        console.error("Error downloading images:", error);
    }
}

// Start downloading
downloadImages();
