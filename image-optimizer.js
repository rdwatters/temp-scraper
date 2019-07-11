const fs = require("fs");
const path = require('path');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const resizeImg = require('resize-img');

function getFilesizeInBytes(filename) {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

const directoryPath = path.join(__dirname, 'images-original');
//passsing directoryPath and callback function

fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
        var fullImagePath = "./images-original/" + file;
        var newImagePath = "./images-optimized/" + file;
        var fileSize = getFilesizeInBytes(fullImagePath);
        var fileSizeInKb = fileSize / 1024;
        if (fileSizeInKb > 5000) {
            resizeImg(fs.readFileSync(fullImagePath), {
                width: 400
            }).then(buf => {
                fs.writeFileSync(newImagePath, buf);
            });
            // console.log(file + ": " + fileSizeInKb);
            // // imagemin([fullImagePath], 'images-optimized', {
            // //     use: [imageminJpegtran()]
            // // }).then(() => {
            // //     console.log(file + " = optimized");
            // // });
            // const files = await imagemin(['./images-original/*.{jpg,png}'], {
            //                     destination: './images-optimized',
            //                     plugins: [
            //                         imageminJpegtran()
            //                     ]
            //                 });

            // //     // console.log(files);
            // //     //=> [{data: <Buffer 89 50 4e …>, path: 'build/images/foo.jpg'}, …]
            // // })();
        }
        // Do whatever you want to do with the file
    });
});



// var theImageSize = getFilesizeInBytes("./images-original/03-26-glassart.png");
// console.log(theImageSize);

// (async () => {
//     const files = await imagemin(['./images-original/*.{jpg,png}'], {
//         destination: './images-optimized',
//         plugins: [
//             imageminJpegtran()
//             // ,
//             // imageminPngquant({
//             //     quality: [0.8, 0.8]
//             // })
//         ]
//     });

//     console.log(files);
//     //=> [{data: <Buffer 89 50 4e …>, path: 'build/images/foo.jpg'}, …]
// })();