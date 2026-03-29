const pdf = require('pdf-parse');
console.log("Type of pdf-parse:", typeof pdf);
console.log("Keys of pdf-parse:", Object.keys(pdf));
if (typeof pdf === 'object') {
    console.log("Is there a default?", typeof pdf.default);
}
