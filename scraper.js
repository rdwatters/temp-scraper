// Following three blocks are set up for each news section

//UNCOMMENT FOR NEWS RELEASES

const currentPageListing = "./scripts/news-releases.js"
const imageNewRootUrl = "https://www.uta.edu/news/news-releases/images/";
const imageDirForDownload = "news-releases-images/";
const pageListFilename = "news-releases-pages.json"
const dateElement = ".date-contact"
const bodyElement = ".news-body-section";
const imageListFilename = "news-releases-inline-images-listing.json";

//UNCOMMENT FOR ANNOUNCEMENTS

// const currentPageListing = "./scripts/announcements.js"
// const imageNewRootUrl = "https://www.uta.edu/news/announcements/images/";
// const imageDirForDownload = "announcements-images";
// const pageListFilename = "announcements-pages.json";
// const dateElement = ".date-contact";
// const bodyElement = "#news-body";
// const imageListFilename = "announcements-inline-images-listing.json";

//UNCOMMENT FOR UTA IN THE NEWS

// const currentPageListing = "./scripts/uta-in-the-news.js"
// const imageNewRootUrl = "https://www.uta.edu/news/uta-in-the-news/images/";
// const imageDirForDownload = "uta-in-the-news-images";
// const pageListFilename = "uta-in-the-news-pages.json";
// const dateElement = "#date-field";
// const bodyElement = "#in-the-news-body";
// const imageListFilename = "uta-in-the-news-inline-images-listing.json";


let topics = require('./scripts/topics.js');
let links = require(currentPageListing);
// let links = require('./scripts/announcements.js');
// let links = require('./scripts/uta-in-the-news.js');
let convertToISO = require('./scripts/convertToISO');
let axios = require('axios');
let cheerio = require('cheerio');
let fs = require('fs');
let slugify = require('slugify');
const downloadImage = require('image-downloader');

//create page list array
let pageList = [];
//create image list array
let currentInlineImagesList = [];





links.forEach(function (link) {
    axios.get(link)
        .then((response) => {
            if (response.status === 200) {
                const html = response.data;
                const $ = cheerio.load(html);
                let oldURL = link;
                var fullDateHeading = $(dateElement).first().text();
                var fullDate = ""
                if (fullDateHeading.indexOf("•") > 0) {
                    fullDate = fullDateHeading.split(" • ")[0];
                } 
                //if it's an announcement page, doesn't currently include author name, 
                //so skip reference to "•"
                else if (link.includes("announcements")) {
                    fullDate = $(dateElement).text();
                }
                else if (link.includes("in-the-news")){
                    fullDate = $("#date-field").text();
                }
                else {
                    fullDate = $("#news-header > .floatleft").first().text();
                }
                let isoDate = convertToISO(fullDate);
                let pageTitle = $('.page-title').text();
                let newSlug = slugify(pageTitle, {
                    lower: true
                });
                let tagLinks = $('.tags a');

                var tagArray = [];
                tagLinks.each(function (item) {
                    var theTag = $(this).text().toLowerCase();
                    if (topics.topicsTaxonomy.includes(theTag)) {
                        tagArray.push(theTag);
                    }
                });
                var bodyCopy = "";
                if (bodyElement == "#news-body") {
                    bodyCopy = $("#news-body").html();
                } else if (bodyElement == "#in-the-news-body") {
                    bodyCopy = $("#in-the-news-body").html();
                } else {
                    let bodyCopies = $(".news-body-section");
                    // let bodyCopy = "";
                    bodyCopies.each(function () {
                        // grab all inline images
                        var oldInlineImgs = $(this).find('img');
                        // grab all the image/featherlight wrapper divs
                        let imageDivWrappers = $(this).find('[class^="image-caption"]');
                        let featherLightAnchors = $(this).find('[data-featherlight]');
                        // iterate through all inline images
                        oldInlineImgs.each(function () {
                            // create abs src to push to allow for scraping all images at once
                            var currentAbsSrc = encodeURI($(this).attr('src').replace("../../../", "https://www.uta.edu/news/"));
                            var currentInlineImgFilenameOnly = currentAbsSrc.split("/").pop();
                            var newInlineImageFilenameOnly = decodeURI(currentInlineImgFilenameOnly).replace(/\s+/g, '-').toLowerCase();
                            var newAbsSrc = imageNewRootUrl + newInlineImageFilenameOnly;
                            var newLocalDownloadDest = imageDirForDownload + newInlineImageFilenameOnly;
                            $(this).attr('src', newAbsSrc);
                            currentInlineImagesList.push(currentAbsSrc);
                            let options = {
                                url: currentAbsSrc,
                                dest: newLocalDownloadDest
                            };
                            downloadImage.image(options);
                        });
                        console.log(`No featherLights ${link} = ${featherLightAnchors.length}`);
                        imageDivWrappers.each(function () {
                            var currentClassName = $(this).attr('class');
                            var innerImage = $(this).find('[data-featherlight]').html();
                            if (innerImage == null){
                                innerImage = $(this).find('img');
                            }
                            var captionText = $(this).find('p').first().text();
                            var caption = "";
                            // only add caption is there is one; otherwise omit <figcaption> element
                            if(captionText.length > 0){
                                caption = `<figcaption>${captionText}</figcaption>`;
                            }
                            var newInnerContent = innerImage + caption;
                            var newFigure = "<figure class='" + currentClassName + "'>" + newInnerContent + "</figure>";
                            $(this).replaceWith(newFigure);
                        });
                        bodyCopy += $(this).html();
                    });
                }

                pageList.push({
                    oldURL: oldURL,
                    newSlug: newSlug,
                    pageTitle: pageTitle,
                    publishDate: isoDate,
                    mediaContact: "UT Arlington Media Relations",
                    mediaContactURL: "/news/contact/",
                    topics: tagArray,
                    audience: ["media"],
                    body: bodyCopy
                });
            }
            fs.writeFile(pageListFilename, JSON.stringify(pageList, null, 4),
                (err) => console.log('Current page content successfully written!'))
            fs.writeFile(imageListFilename, JSON.stringify(currentInlineImagesList, null, 4),
                (err) => console.log('Current images src successfully written!'))
        }, (err) => console.log(link + " threw an error."));
})