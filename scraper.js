// Following three blocks are set up for each news section

//UNCOMMENT FOR NEWS RELEASES

const currentPageListing = "./scripts/news-releases.js";
const imageNewRootUrl = "/news/images/";
const imageDirForDownload = "images-original/";
const pageListFilename = "news-releases-pages.json"
const dateElement = ".date-contact"
const bodyElement = ".news-body-section";
const imageListFilename = "news-releases-inline-images-listing.json";
const download = require('download');
const newRootRelativeBase = "/news/news-releases/"

//UNCOMMENT FOR ANNOUNCEMENTS

// const currentPageListing = "./scripts/announcements.js"
// const imageNewRootUrl = "/news/images/";
// const imageDirForDownload = "announcements-images";
// const pageListFilename = "announcements-pages.json";
// const dateElement = ".date-contact";
// const bodyElement = "#news-body";
// const imageListFilename = "announcements-inline-images-listing.json";

//UNCOMMENT FOR UTA IN THE NEWS

// const currentPageListing = "./scripts/uta-in-the-news.js"
// const imageNewRootUrl = "/news/images/";
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
//create image error array
let imageRelatedErrorsList = "Current Page, Current 'src' Attribute inside <img> tag, Change to This Filename before Uploading, New URL of Page\n";


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
                } else if (link.includes("in-the-news")) {
                    fullDate = $("#date-field").text();
                } else {
                    fullDate = $("#news-header > .floatleft").first().text();
                }
                let isoDate = convertToISO(fullDate);
                let dateAsDirectories = isoDate.replace(/\-/g, "/");
                let pageTitle = $('.page-title').text();
                let newSlug = slugify(pageTitle, {
                    lower: true
                });
                newSlug = newSlug.replace(/'/g, '');
                let tagLinks = $('.tags a');

                var tagArray = [];
                if (tagLinks.length > 0) {
                    tagLinks.each(function (item) {
                        var theTag = $(this).text().toLowerCase();
                        if (topics.topicsTaxonomy.includes(theTag)) {
                            tagArray.push(theTag);
                        }
                    });
                }
                var bodyCopy = "";
                var shortDesc = "";
                if (bodyElement == "#news-body") {
                    bodyCopy = $("#news-body").html();
                    shortDesc = bodCopy.text().substring(0,150);
                } else if (bodyElement == "#in-the-news-body") {
                    bodyCopy = $("#in-the-news-body").html();
                    shortDesc = bodCopy.text().substring(0, 150);
                } else {
                    let bodyCopies = $(".news-body-section");
                    // let bodyCopy = "";
                    bodyCopies.each(function () {
                        // grab all inline images
                        var oldInlineImgs = $(this).find('img');
                        // grab all the image/featherlight wrapper divs
                        let imageDivWrappers = $(this).find('[class^="image-caption"]');
                        // let featherLightAnchors = $(this).find('[data-featherlight]');
                        // iterate through all inline images
                        if (oldInlineImgs.length > 0) {
                            oldInlineImgs.each(function () {
                                // create abs src to push to allow for scraping all images at once
                                var currentAbsSrc = encodeURI($(this).attr('src').replace("../../../", "https://www.uta.edu/news/"));
                                var currentInlineImgFilenameOnly = currentAbsSrc.split("/").pop();
                                var newInlineImageFilenameOnly = decodeURI(currentInlineImgFilenameOnly).replace(/\s+/g, '-').toLowerCase().replace("jpg", "jpeg");
                                var numberOfDots = newInlineImageFilenameOnly.split('.').length - 1;
                                if (!(/jpg|png|jpeg/).test(newInlineImageFilenameOnly)) {
                                    newInlineImageFilenameOnly += ".jpeg"
                                }
                                //see if the new filename has both the file extension *and* more than one dot
                                else if ((/jpg|png|jpeg/).test(newInlineImageFilenameOnly) && (numberOfDots > 1)) {
                                    var newInlineImageFilenameArray = newInlineImageFilenameOnly.split(".");
                                    var newInlineImageFileExtensionOnly = newInlineImageFilenameArray.pop();
                                    // console.log("This is the newInlineImageFilenameArray now = " + newInlineImageFilenameArray);
                                    // console.log("This is the newInlineImageFileExtensionOnly now = " + newInlineImageFileExtensionOnly);
                                    newInlineImageFilenameOnly = newInlineImageFilenameArray.join("").replace(".","-") + "." + newInlineImageFileExtensionOnly;
                                    console.log("NEW FILENAME = " + newInlineImageFilenameOnly);
                                }
                                var newAbsSrc = imageNewRootUrl + newInlineImageFilenameOnly;
                                var newLocalDownloadDest = imageDirForDownload + newInlineImageFilenameOnly;
                                $(this).attr('src', newAbsSrc);
                                currentInlineImagesList.push(currentAbsSrc);
                                if ((/jpg|png|jpeg/).test(currentAbsSrc)) {
                                    var options = {
                                        url: currentAbsSrc,
                                        dest: newLocalDownloadDest
                                    };
                                    try {
                                        downloadImage.image(options);
                                    } catch (error) {
                                        console.log("ERROR ON IMAGE AT = " + currentAbsSrc);
                                    }
                                } else {
                                    var newRootRelativePageUrl = newRootRelativeBase + dateAsDirectories + newSlug;
                                    var imageFileExtensionError = link + ", " + currentAbsSrc + ", " + newInlineImageFilenameOnly + ", " + newRootRelativePageUrl + "\n";
                                    imageRelatedErrorsList += imageFileExtensionError;
                                }
                            });
                        }
                        if (imageDivWrappers.length > 0) {
                            imageDivWrappers.each(function () {
                                var currentClassName = $(this).attr('class').replace('image-caption', 'figure float');
                                var innerImage = $(this).find('[data-featherlight]').html();
                                if (innerImage == null) {
                                    innerImage = $(this).find('img');
                                }
                                var captionText = $(this).find('p').first().text();
                                var caption = "";
                                // only add caption if there is one; otherwise omit <figcaption> element
                                if (captionText.length > 0) {
                                    caption = `<figcaption>${captionText}</figcaption>`;
                                }
                                var newInnerContent = innerImage + caption;
                                var newFigure = "<figure class='" + currentClassName + "'>" + newInnerContent + "</figure>";
                                $(this).replaceWith(newFigure);
                            });
                        }
                        bodyCopy += $(this).html();
                        
                    });
                    
                }
                // shortDesc = bodyCopy.text().substring(0, 150);

                pageList.push({
                    oldURL: oldURL,
                    newSlug: newSlug,
                    pageTitle: pageTitle,
                    publishDate: isoDate,
                    mediaContact: "UT Arlington Media Relations",
                    mediaContactURL: "/news/contact/",
                    topics: tagArray,
                    audience: ["media"],
                    shortDescription: shortDesc,
                    body: bodyCopy
                });
            }
            fs.writeFile(pageListFilename, JSON.stringify(pageList, null, 4),
                (err) => console.log('Page content success'));
            fs.writeFile(imageListFilename, JSON.stringify(currentInlineImagesList, null, 4),
                (err) => console.log('Current image success'));
            fs.writeFile("image-errors.csv", imageRelatedErrorsList,
                (err) => console.log('Undownloadable image added to image-errors.csv'));
        })
});

