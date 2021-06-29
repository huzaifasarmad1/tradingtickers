var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var TickerSchema = new Schema({
    date: Date,
    ticker: String,
    status: String,
    closed_price: String,
    average_type:String,
    smoothe:String,
    
});
module.exports = mongoose.model('ticker', TickerSchema);
