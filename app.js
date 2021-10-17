const https = require('https');
var cron = require('node-cron');
var mongoose = require('mongoose');
const fetch = require('node-fetch');
var TickerSchema = require('./TickerSchema')
const express = require('express');
const cors = require('cors');
const app = express();
const hostname = '127.0.0.1';
const port = 4000;
const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler')

const {
  ma, dma, ema, sma, wma
} = require('finmath');
const { type } = require('os');

// create reusable transporter object using the default SMTP transport  
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '', //add email from where you want to send the email
    pass: '' //add pass for that email
  }
});
mongoose.connect('', { useNewUrlParser: true });

app.use(cors())
const asyncIntervals = [];
const runAsyncInterval = async (cb, interval, intervalIndex) => {
  await cb();
  if (asyncIntervals[intervalIndex]) {
    setTimeout(() => runAsyncInterval(cb, interval, intervalIndex), interval);
  }
};
const setAsyncInterval = (cb, interval) => {
  if (cb && typeof cb === "function") {
    const intervalIndex = asyncIntervals.length;
    asyncIntervals.push(true);
    runAsyncInterval(cb, interval, intervalIndex);
    return intervalIndex;
  } else {
    throw new Error('Callback must be a function');
  }
};

const clearAsyncInterval = (intervalIndex) => {
  if (asyncIntervals[intervalIndex]) {
    asyncIntervals[intervalIndex] = false;
  }
};
let statusarray = [];
app.get('/', async (req, res) => {
  var smoothe = req.query.smoothe;
  var average_type = req.query.average_type
  if (!req.query.date) {
    req.query.date = new Date();
    req.query.date = new Date(req.query.date.getFullYear(), req.query.date.getMonth(), req.query.date.getDate());
  } else {
    req.query.date = new Date(req.query.date);
  }
  req.query.start_date = new Date(req.query.date);
  req.query.end_date = new Date(req.query.date.setDate(req.query.date.getDate() + 1));

  TickerSchema.find({ date: { $gte: req.query.start_date, $lt: req.query.end_date }, average_type: req.query.average_type, smoothe: req.query.smoothe }, (err, db) => {

    if (!err) {
      res.send(db);
    }
    else {
      console.log("retrieval unsuccessful")
      console.log(err)
    }
  })
})
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
cron.schedule('0 4 * * 2-6', () => {
  console.log('running a task every 4am');
  func();

});

let storedb = async (ticker) => {

  const db = await TickerSchema.create(ticker);
}

let SMA = async (allData, latestData, smoothe) => {

  let arrmatoday = []
  let arrmayesterday = []
  let arrmaereyesterday = []
  let arrmafreyesterday = []
  let arrmavreyesterday = []
  let arrmavireyesterday = []
  var status = ''
  var first_Indicator = ''
  var second_Indicator = ''
  var indicatorstatus = ''
  var average_type = 'SMA'
  try {

    for (j = allData.length - 20; j < allData.length; j++) {
      arrmatoday.push(allData[j].close)
    }

    var todayma = ma(arrmatoday, 20)

    for (j = allData.length - 21; j < allData.length - 1; j++) {
      arrmayesterday.push(allData[j].close)
    }
    var yesterdayma = ma(arrmayesterday, 20)
    for (j = allData.length - 22; j < allData.length - 2; j++) {
      arrmaereyesterday.push(allData[j].close)
    }
    var ereyesterdayma = ma(arrmaereyesterday, 20)

    //
    for (j = allData.length - 23; j < allData.length - 3; j++) {
      arrmafreyesterday.push(allData[j].close)
    }
    var freyesterdayma = ma(arrmafreyesterday, 20)
    for (j = allData.length - 24; j < allData.length - 4; j++) {
      arrmavreyesterday.push(allData[j].close)
    }
    var vreyesterdayma = ma(arrmavreyesterday, 20)

    for (j = allData.length - 25; j < allData.length - 5; j++) {
      arrmavireyesterday.push(allData[j].close)
    }
    var vireyesterdayma = ma(arrmavireyesterday, 20)

    var todayoutma = todayma[todayma.length - 1]
    var yesterdayoutma = yesterdayma[yesterdayma.length - 1]
    var ereyesterdayoutma = ereyesterdayma[ereyesterdayma.length - 1]
    var freyesterdayoutma = freyesterdayma[freyesterdayma.length - 1]
    var vreyesterdayoutma = vreyesterdayma[vreyesterdayma.length - 1]
    var vireyesterdayoutma = vireyesterdayma[vireyesterdayma.length - 1]

    if (smoothe == 1) {
      if (todayoutma >= yesterdayoutma) {
        if (yesterdayoutma < ereyesterdayoutma) {
          status = 'red to green'
        }
        else {
          console.log('color not changed')
        }
      }
      else {
        if (yesterdayoutma > ereyesterdayoutma) {
          status = 'green to red'
        }
        else {
          console.log('color not changed')

        }
      }
    }
    else {
      console.log('Smoothe!=1')
    }
    if (smoothe == 2) {
      if (todayoutma > ereyesterdayoutma) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutma <= ereyesterdayoutma) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutma > freyesterdayoutma) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutma <= freyesterdayoutma) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    else {
      console.log('Smoothe!=2')
    }

    //

    if (smoothe == 3) {
      if (todayoutma > freyesterdayoutma) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutma <= freyesterdayoutma) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutma > vreyesterdayoutma) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutma <= vreyesterdayoutma) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    if (smoothe == 4) {
      if (todayoutma > vreyesterdayoutma) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutma <= vreyesterdayoutma) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutma > vireyesterdayoutma) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutma <= vireyesterdayoutma) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }
      }
    }
  }
  catch {
    console.log('in catch')
  }
  let SMAobj = { status: status, average_type: average_type, smoothe: smoothe }
  return SMAobj;
}
//
let EMA = async (allData, latestData, smoothe) => {
  let arrematoday = []
  let arremayesterday = []
  let arremaereyesterday = []
  let arremafreyesterday = []
  let arremavreyesterday = []
  let arremavireyesterday = []
  var status = ''
  var first_Indicator = ''
  var second_Indicator = ''
  var indicatorstatus = ''
  var average_type = 'EMA'

  try {
    for (j = allData.length - 20; j < allData.length; j++) {
      arrematoday.push(allData[j].close)
    }
    var todayema = ema(arrematoday, 20)

    for (j = allData.length - 21; j < allData.length - 1; j++) {
      arremayesterday.push(allData[j].close)
    }
    var yesterdayema = ema(arremayesterday, 20)
    for (j = allData.length - 22; j < allData.length - 2; j++) {
      arremaereyesterday.push(allData[j].close)
    }
    var ereyesterdayema = ema(arremaereyesterday, 20)

    //
    for (j = allData.length - 23; j < allData.length - 3; j++) {
      arremafreyesterday.push(allData[j].close)
    }
    var freyesterdayema = ema(arremafreyesterday, 20)
    for (j = allData.length - 24; j < allData.length - 4; j++) {
      arremavreyesterday.push(allData[j].close)
    }
    var vreyesterdayema = ema(arremavreyesterday, 20)

    for (j = allData.length - 25; j < allData.length - 5; j++) {
      arremavireyesterday.push(allData[j].close)
    }
    var vireyesterdayema = ema(arremavireyesterday, 20)

    var todayoutema = todayema[todayema.length - 1]
    var yesterdayoutema = yesterdayema[yesterdayema.length - 1]

    var ereyesterdayoutema = ereyesterdayema[ereyesterdayema.length - 1]
    var freyesterdayoutema = freyesterdayema[freyesterdayema.length - 1]

    var vreyesterdayoutema = vreyesterdayema[vreyesterdayema.length - 1]

    var vireyesterdayoutema = vireyesterdayema[vireyesterdayema.length - 1]

    if (smoothe == 1) {
      if (todayoutema >= yesterdayoutema) {
        if (yesterdayoutema < ereyesterdayoutema) {
          console.log('color changed')
          status = 'red to green'

        }
        else {
          console.log('color not changed')
        }
      }
      else {
        if (yesterdayoutema > ereyesterdayoutema) {
          console.log('color changed')
          status = 'green to red'

        }
        else {
          console.log('color not changed')

        }
      }
    }
    else {
      console.log('Smoothe!=1')
    }
    if (smoothe == 2) {
      if (todayoutema > ereyesterdayoutema) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutema <= ereyesterdayoutema) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutema > freyesterdayoutema) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutema <= freyesterdayoutema) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    else {
      console.log('Smoothe!=2')
    }

    //

    if (smoothe == 3) {
      if (todayoutema > freyesterdayoutema) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutema <= freyesterdayoutema) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutema > vreyesterdayoutema) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutema <= vreyesterdayoutema) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    if (smoothe == 4) {
      if (todayoutema > vreyesterdayoutema) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutema <= vreyesterdayoutema) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutema > vireyesterdayoutema) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutema <= vireyesterdayoutema) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
  }
  catch {
    console.log('in catch')
  }
  EMAobj = { yesterdayema, ereyesterdayema, status: status, average_type: average_type, smoothe: smoothe }
  return EMAobj;
}
//
let WMA = async (allData, latestData, smoothe) => {
  let arrwmatoday = []
  let arrwmayesterday = []
  let arrwmaereyesterday = []
  let arrwmafreyesterday = []
  let arrwmavreyesterday = []
  let arrwmavireyesterday = []
  var status = ''
  var first_Indicator = ''
  var second_Indicator = ''
  var indicatorstatus = ''
  var average_type = 'WMA'
  try {

    for (j = allData.length - 20; j < allData.length; j++) {
      arrwmatoday.push(allData[j].close)
    }
    var todaywma = wma(arrwmatoday, 20)

    for (j = allData.length - 21; j < allData.length - 1; j++) {
      arrwmayesterday.push(allData[j].close)
    }
    var yesterdaywma = wma(arrwmayesterday, 20)
    for (j = allData.length - 22; j < allData.length - 2; j++) {
      arrwmaereyesterday.push(allData[j].close)
    }
    var ereyesterdaywma = wma(arrwmaereyesterday, 20)

    //
    for (j = allData.length - 23; j < allData.length - 3; j++) {
      arrwmafreyesterday.push(allData[j].close)
    }
    var freyesterdaywma = wma(arrwmafreyesterday, 20)
    for (j = allData.length - 24; j < allData.length - 4; j++) {
      arrwmavreyesterday.push(allData[j].close)
    }
    var vreyesterdaywma = wma(arrwmavreyesterday, 20)

    for (j = allData.length - 25; j < allData.length - 5; j++) {
      arrwmavireyesterday.push(allData[j].close)
    }
    var vireyesterdaywma = wma(arrwmavireyesterday, 20)

    var todayoutwma = todaywma[todaywma.length - 1]
    var yesterdayoutwma = yesterdaywma[yesterdaywma.length - 1]
    var ereyesterdayoutwma = ereyesterdaywma[ereyesterdaywma.length - 1]
    var freyesterdayoutwma = freyesterdaywma[freyesterdaywma.length - 1]
    var vreyesterdayoutwma = vreyesterdaywma[vreyesterdaywma.length - 1]
    var vireyesterdayoutwma = vireyesterdaywma[vireyesterdaywma.length - 1]
    if (smoothe == 1) {
      if (todayoutwma >= yesterdayoutwma) {
        if (yesterdayoutwma < ereyesterdayoutwma) {
          console.log('color changed')
          status = 'red to green'

        }
        else {
          console.log('color not changed')
        }
      }
      else {
        if (yesterdayoutwma > ereyesterdayoutwma) {
          console.log('color changed')
          status = 'green to red'

        }
        else {
          console.log('color not changed')

        }
      }
    }
    else {
      console.log('Smoothe!=1')
    }
    if (smoothe == 2) {
      if (todayoutwma > ereyesterdayoutwma) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutwma <= ereyesterdayoutwma) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutwma > freyesterdayoutwma) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutwma <= freyesterdayoutwma) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    else {
      console.log('Smoothe!=2')
    }

    //

    if (smoothe == 3) {
      if (todayoutwma > freyesterdayoutwma) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutwma <= freyesterdayoutwma) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutwma > vreyesterdayoutwma) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutwma <= vreyesterdayoutwma) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    if (smoothe == 4) {
      if (todayoutwma > vreyesterdayoutwma) {
        first_Indicator = 'green'
      }
      else {
        if (todayoutwma <= vreyesterdayoutwma) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayoutwma > vireyesterdayoutwma) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayoutwma <= vireyesterdayoutwma) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
  }
  catch {
    console.log('in catch')
  }

  let WMAobj = { todaywma, status: status, average_type: average_type, smoothe: smoothe }
  return WMAobj;
}
//

let VWMA = async (allData, latestData, smoothe) => {

  var status = ''
  var average_type = 'VWMA'
  var todaysSum = 0;
  var todaysMultiply = 0;
  for (i = allData.length - 20; i < allData.length; i++) {
    todaysMultiply = allData[i].close * allData[i].volume
    todaysSum = todaysSum + todaysMultiply
  }
  var todayvol = 0;
  for (i = allData.length - 20; i < allData.length; i++) {
    todayvol = todayvol + allData[i].volume
  }
  let todayvwma = todaysSum / todayvol;

  var yesterdaySum = 0;
  var yesterdaysMultiply = 0;
  for (i = allData.length - 21; i < allData.length - 1; i++) {
    yesterdaysMultiply = allData[i].close * allData[i].volume
    yesterdaySum = yesterdaySum + yesterdaysMultiply
  }
  var yesterdayvol = 0;
  for (i = allData.length - 21; i < allData.length - 1; i++) {
    yesterdayvol = yesterdayvol + allData[i].volume
  }
  let yesterdayvwma = yesterdaySum / yesterdayvol;

  var ereyesterdaySum = 0;
  var ereyesterdaysMultiply = 0;
  for (i = allData.length - 22; i < allData.length - 2; i++) {
    ereyesterdaysMultiply = allData[i].close * allData[i].volume
    ereyesterdaySum = ereyesterdaySum + ereyesterdaysMultiply
  }
  var ereyesterdayvol = 0;
  for (i = allData.length - 22; i < allData.length - 2; i++) {
    ereyesterdayvol = ereyesterdayvol + allData[i].volume
  }
  let ereyesterdayvwma = ereyesterdaySum / ereyesterdayvol;
  var freyesterdaySum = 0;
  var freyesterdaysMultiply = 0;
  for (i = allData.length - 23; i < allData.length - 3; i++) {
    freyesterdaysMultiply = allData[i].close * allData[i].volume
    freyesterdaySum = freyesterdaySum + freyesterdaysMultiply
  }
  var freyesterdayvol = 0;
  for (i = allData.length - 23; i < allData.length - 3; i++) {
    freyesterdayvol = freyesterdayvol + allData[i].volume
  }
  let freyesterdayvwma = freyesterdaySum / freyesterdayvol;
  var sum5 = 0;
  var vreyesterdaysMultiply = 0;
  for (i = allData.length - 24; i < allData.length - 4; i++) {
    vreyesterdaysMultiply = allData[i].close * allData[i].volume
    sum5 = sum5 + vreyesterdaysMultiply
  }
  var vreyesterdayvol = 0;
  for (i = allData.length - 24; i < allData.length - 4; i++) {
    vreyesterdayvol = vreyesterdayvol + allData[i].volume
  }
  let vreyesterdayvwma = sum5 / vreyesterdayvol;
  var vireyesterdaySum = 0;
  var vireyesterdaysMultiply = 0;
  for (i = allData.length - 25; i < allData.length - 5; i++) {
    vireyesterdaysMultiply = allData[i].close * allData[i].volume
    vireyesterdaySum = vireyesterdaySum + vireyesterdaysMultiply
  }
  var vireyesterdayvol = 0;
  for (i = allData.length - 25; i < allData.length - 5; i++) {
    vireyesterdayvol = vireyesterdayvol + allData[i].volume
  }
  let vireyesterdayvwma = vireyesterdaySum / vireyesterdayvol;
  // console.log(vireyesterdayvwma + 'is vireyesterdays volume weighted moving average')
  if (smoothe == 1) {
    if (todayvwma >= yesterdayvwma) {
      if (yesterdayvwma < ereyesterdayvwma) {
        console.log('color changed')
        status = 'red to green'

      }
      else {
        console.log('color not changed')
      }
    }
    else {
      if (yesterdayvwma > ereyesterdayvwma) {
        console.log('color changed')
        status = 'green to red'

      }
      else {
        console.log('color not changed')

      }
    }
  }
  else {
    console.log('Smoothe!=1')
  }
  if (smoothe == 2) {
    if (todayvwma > ereyesterdayvwma) {
      first_Indicator = 'green'
    }
    else {
      if (todayvwma <= ereyesterdayvwma) {
        first_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (yesterdayvwma > freyesterdayvwma) {
      second_Indicator = 'green'
    }
    else {
      if (yesterdayvwma <= freyesterdayvwma) {
        second_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (first_Indicator == second_Indicator) {
      console.log('color not changed')
    }
    else {
      if (first_Indicator == 'red' && second_Indicator == 'green') {
        status = 'green to red'
        console.log('color changed')
      }
      else {
        if (first_Indicator == 'green' && second_Indicator == 'red') {
          console.log('color changed')
          status = 'red to green'
        }
      }

    }
  }
  else {
    console.log('Smoothe!=2')
  }
  if (smoothe == 3) {
    if (todayvwma > freyesterdayvwma) {
      first_Indicator = 'green'
    }
    else {
      if (todayvwma <= freyesterdayvwma) {
        first_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (yesterdayvwma > vreyesterdayvwma) {
      second_Indicator = 'green'
    }
    else {
      if (yesterdayvwma <= vreyesterdayvwma) {
        second_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (first_Indicator == second_Indicator) {
      console.log('color not changed')
    }
    else {
      if (first_Indicator == 'red' && second_Indicator == 'green') {
        status = 'green to red'
        console.log('color changed')
      }
      else {
        if (first_Indicator == 'green' && second_Indicator == 'red') {
          console.log('color changed')
          status = 'red to green'
        }
      }

    }
  }
  if (smoothe == 4) {
    if (todayvwma > vreyesterdayvwma) {
      first_Indicator = 'green'
    }
    else {
      if (todayvwma <= vreyesterdayvwma) {
        first_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (yesterdayvwma > vireyesterdayvwma) {
      second_Indicator = 'green'
    }
    else {
      if (yesterdayvwma <= vireyesterdayvwma) {
        second_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (first_Indicator == second_Indicator) {
      console.log('color not changed')
    }
    else {
      if (first_Indicator == 'red' && second_Indicator == 'green') {
        status = 'green to red'
        console.log('color changed')
      }
      else {
        if (first_Indicator == 'green' && second_Indicator == 'red') {
          console.log('color changed')
          status = 'red to green'
        }
      }

    }
  }
  let VWMAobj = { status: status, average_type: average_type, smoothe: smoothe }
  return VWMAobj;
}
//
let HULLMA = async (allData, latestData, smoothe) => {
  var status = ''
  var average_type = 'HULLMA'
  let arrsec10today = []
  let arrsec20today = []
  let finalvalues10today = []
  let finalvalues20today = []
  let multarraytoday = []
  let subtarraytoday = []

  let arrsec10yesterday = []
  let arrsec20yesterday = []
  let finalvalues10yesterday = []
  let finalvalues20yesterday = []
  let multarrayyesterday = []
  let subtarrayyesterday = []

  let arrsec10ereyesterday = []
  let arrsec20ereyesterday = []
  let finalvalues10ereyesterday = []
  let finalvalues20ereyesterday = []
  let multarrayereyesterday = []
  let subtarrayereyesterday = []

  let arrsec10freyesterday = []
  let arrsec20freyesterday = []
  let finalvalues10freyesterday = []
  let finalvalues20freyesterday = []
  let multarrayfreyesterday = []
  let subtarrayfreyesterday = []

  let arrsec10vreyesterday = []
  let arrsec20vreyesterday = []
  let finalvalues10vreyesterday = []
  let finalvalues20vreyesterday = []
  let multarrayvreyesterday = []
  let subtarrayvreyesterday = []

  let arrsec10vireyesterday = []
  let arrsec20vireyesterday = []
  let finalvalues10vireyesterday = []
  let finalvalues20vireyesterday = []
  let multarrayvireyesterday = []
  let subtarrayvireyesterday = []
  try {

    for (j = allData.length - 13; j < allData.length; j++) {
      arrsec10today.push(allData[j].close)
    }
    var tenwmatoday = wma(arrsec10today, 10)
    for (j = allData.length - 23; j < allData.length; j++) {
      arrsec20today.push(allData[j].close)
    }
    var twentywmatoday = wma(arrsec20today, 20)
    for (j = tenwmatoday.length - 4; j < tenwmatoday.length; j++) {
      finalvalues10today.push(tenwmatoday[j])
    }
    for (j = twentywmatoday.length - 4; j < twentywmatoday.length; j++) {
      finalvalues20today.push(twentywmatoday[j])
    }
    for (i = 0; i < 4; i++) {
      multarraytoday.push(finalvalues10today[i] * 2)
    }
    for (i = 0; i < 4; i++) {
      subtarraytoday.push(multarraytoday[i] - finalvalues20today[i])
    }
    var todayhull = wma(subtarraytoday, 4)
    for (j = allData.length - 14; j < allData.length - 1; j++) {
      arrsec10yesterday.push(allData[j].close)
    }
    var tenwmayesterday = wma(arrsec10yesterday, 10)
    for (j = allData.length - 24; j < allData.length - 1; j++) {
      arrsec20yesterday.push(allData[j].close)
    }
    var twentywmayesterday = wma(arrsec20yesterday, 20)
    for (j = tenwmayesterday.length - 4; j < tenwmayesterday.length; j++) {
      finalvalues10yesterday.push(tenwmayesterday[j])
    }

    for (j = twentywmayesterday.length - 4; j < twentywmayesterday.length; j++) {
      finalvalues20yesterday.push(twentywmayesterday[j])
    }
    for (i = 0; i < 4; i++) {
      multarrayyesterday.push(finalvalues10yesterday[i] * 2)
    }
    for (i = 0; i < 4; i++) {
      subtarrayyesterday.push(multarrayyesterday[i] - finalvalues20yesterday[i])
    }
    var yesterdayhull = wma(subtarrayyesterday, 4)
    for (j = allData.length - 15; j < allData.length - 2; j++) {
      arrsec10ereyesterday.push(allData[j].close)
    }
    var tenwmaereyesterday = wma(arrsec10ereyesterday, 10)
    for (j = allData.length - 25; j < allData.length - 2; j++) {
      arrsec20ereyesterday.push(allData[j].close)
    }
    var twentywmaereyesterday = wma(arrsec20ereyesterday, 20)
    for (j = tenwmaereyesterday.length - 4; j < tenwmaereyesterday.length; j++) {
      finalvalues10ereyesterday.push(tenwmaereyesterday[j])
    }
    for (j = twentywmaereyesterday.length - 4; j < twentywmaereyesterday.length; j++) {
      finalvalues20ereyesterday.push(twentywmaereyesterday[j])
    }
    for (i = 0; i < 4; i++) {
      multarrayereyesterday.push(finalvalues10ereyesterday[i] * 2)
    }
    for (i = 0; i < 4; i++) {
      subtarrayereyesterday.push(multarrayereyesterday[i] - finalvalues20ereyesterday[i])
    }
    var ereyesterdayhull = wma(subtarrayereyesterday, 4)
    for (j = allData.length - 16; j < allData.length - 3; j++) {
      arrsec10freyesterday.push(allData[j].close)
    }
    var tenwmafreyesterday = wma(arrsec10freyesterday, 10)
    for (j = allData.length - 26; j < allData.length - 3; j++) {
      arrsec20freyesterday.push(allData[j].close)
    }
    var twentywmafreyesterday = wma(arrsec20freyesterday, 20)
    for (j = tenwmafreyesterday.length - 4; j < tenwmafreyesterday.length; j++) {
      finalvalues10freyesterday.push(tenwmafreyesterday[j])
    }
    for (j = twentywmafreyesterday.length - 4; j < twentywmafreyesterday.length; j++) {
      finalvalues20freyesterday.push(twentywmafreyesterday[j])
    }
    for (i = 0; i < 4; i++) {
      multarrayfreyesterday.push(finalvalues10freyesterday[i] * 2)
    }
    for (i = 0; i < 4; i++) {
      subtarrayfreyesterday.push(multarrayfreyesterday[i] - finalvalues20freyesterday[i])
    }
    var freyesterdayhull = wma(subtarrayfreyesterday, 4)
    for (j = allData.length - 17; j < allData.length - 4; j++) {
      arrsec10vreyesterday.push(allData[j].close)
    }
    var tenwmavreyesterday = wma(arrsec10vreyesterday, 10)
    for (j = allData.length - 27; j < allData.length - 4; j++) {
      arrsec20vreyesterday.push(allData[j].close)
    }
    var twentywmavreyesterday = wma(arrsec20vreyesterday, 20)
    for (j = tenwmavreyesterday.length - 4; j < tenwmavreyesterday.length; j++) {
      finalvalues10vreyesterday.push(tenwmavreyesterday[j])
    }
    for (j = twentywmavreyesterday.length - 4; j < twentywmavreyesterday.length; j++) {
      finalvalues20vreyesterday.push(twentywmavreyesterday[j])
    }
    for (i = 0; i < 4; i++) {
      multarrayvreyesterday.push(finalvalues10vreyesterday[i] * 2)
    }
    for (i = 0; i < 4; i++) {
      subtarrayvreyesterday.push(multarrayvreyesterday[i] - finalvalues20vreyesterday[i])
    }
    var vreyesterdayhull = wma(subtarrayvreyesterday, 4)
    for (j = allData.length - 18; j < allData.length - 5; j++) {
      arrsec10vireyesterday.push(allData[j].close)
    }
    var tenwmavireyesterday = wma(arrsec10vireyesterday, 10)
    for (j = allData.length - 28; j < allData.length - 5; j++) {
      arrsec20vireyesterday.push(allData[j].close)
    }
    var twentywmavireyesterday = wma(arrsec20vireyesterday, 20)
    for (j = tenwmavireyesterday.length - 4; j < tenwmavireyesterday.length; j++) {
      finalvalues10vireyesterday.push(tenwmavireyesterday[j])
    }
    for (j = twentywmavireyesterday.length - 4; j < twentywmavireyesterday.length; j++) {
      finalvalues20vireyesterday.push(twentywmavireyesterday[j])
    }
    for (i = 0; i < 4; i++) {
      multarrayvireyesterday.push(finalvalues10vireyesterday[i] * 2)
    }
    for (i = 0; i < 4; i++) {
      subtarrayvireyesterday.push(multarrayvireyesterday[i] - finalvalues20vireyesterday[i])
    }
    var vireyesterdayhull = wma(subtarrayvireyesterday, 4)
    var todayouthull = todayhull[todayhull.length - 1]
    var yesterdayouthull = yesterdayhull[yesterdayhull.length - 1]
    var ereyesterdayouthull = ereyesterdayhull[ereyesterdayhull.length - 1]
    var freyesterdayouthull = freyesterdayhull[freyesterdayhull.length - 1]
    var vreyesterdayouthull = vreyesterdayhull[vreyesterdayhull.length - 1]
    var vireyesterdayouthull = vireyesterdayhull[vireyesterdayhull.length - 1]
    if (smoothe == 1) {
      if (todayouthull >= yesterdayouthull) {
        if (yesterdayouthull < ereyesterdayouthull) {
          console.log('color changed')
          status = 'red to green'

        }
        else {
          console.log('color not changed')
        }
      }
      else {
        if (yesterdayouthull > ereyesterdayouthull) {
          console.log('color changed')
          status = 'green to red'

        }
        else {
          console.log('color not changed')
        }
      }
    }
    else {
      console.log('Smoothe!=1')
    }
    if (smoothe == 2) {
      if (todayouthull > ereyesterdayouthull) {
        first_Indicator = 'green'
      }
      else {
        if (todayouthull <= ereyesterdayouthull) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayouthull > freyesterdayouthull) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayouthull <= freyesterdayouthull) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    else {
      console.log('Smoothe!=2')
    }
    if (smoothe == 3) {
      if (todayouthull > freyesterdayouthull) {
        first_Indicator = 'green'
      }
      else {
        if (todayouthull <= freyesterdayouthull) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayouthull > vreyesterdayouthull) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayouthull <= vreyesterdayouthull) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }
      }
    }
    if (smoothe == 4) {
      if (todayouthull > vreyesterdayouthull) {
        first_Indicator = 'green'
      }
      else {
        if (todayouthull <= vreyesterdayouthull) {
          first_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (yesterdayouthull > vireyesterdayouthull) {
        second_Indicator = 'green'
      }
      else {
        if (yesterdayouthull <= vireyesterdayouthull) {
          second_Indicator = 'red'
        }
        else {
          console.log('color not changed')
        }
      }

      if (first_Indicator == second_Indicator) {
        console.log('color not changed')
      }
      else {
        if (first_Indicator == 'red' && second_Indicator == 'green') {
          status = 'green to red'
          console.log('color changed')
        }
        else {
          if (first_Indicator == 'green' && second_Indicator == 'red') {
            console.log('color changed')
            status = 'red to green'
          }
        }

      }
    }
    let HULLMAobj = { status: status, average_type: average_type, smoothe: smoothe }
    return HULLMAobj;
  }

  catch {
    console.log('in catch')
  }

}
let funtema = async (allData, latestData, smoothe) => {
  let status = ''
  var average_type = 'TEMA'
  let arrematoday = []
  let todayema1 = []
  var todayfirstema1 = []
  let todayema2 = []
  let todayema3 = []
  //
  let arremayesterday = []
  let yesterdayema1 = []
  var yesterdayfirstema1 = []
  let yesterdayema2 = []
  let yesterdayema3 = []
  //
  let arremaereyesterday = []
  let ereyesterdayema1 = []
  var ereyesterdayfirstema1 = []
  let ereyesterdayema2 = []
  let ereyesterdayema3 = []

  let arremafreyesterday = []
  let freyesterdayema1 = []
  var freyesterdayfirstema1 = []
  let freyesterdayema2 = []
  let freyesterdayema3 = []

  let arremavreyesterday = []
  let vreyesterdayema1 = []
  var vreyesterdayfirstema1 = []
  let vreyesterdayema2 = []
  let vreyesterdayema3 = []

  let arremavireyesterday = []
  let vireyesterdayema1 = []
  var vireyesterdayfirstema1 = []
  let vireyesterdayema2 = []
  let vireyesterdayema3 = []
  for (j = allData.length - 20; j < allData.length; j++) {
    arrematoday.push(allData[j].close)
  }
  todayfirstema1 = ema(arrematoday, 20)
  for (j = 0; j < 20; j++) {
    todayema1.push(todayfirstema1[j] * 3)
  }
  var todaysecondema2 = ema(todayfirstema1, 20)
  for (k = 0; k < 20; k++) {
    todayema2.push(todaysecondema2[k] * 3)
  }
  todayema3 = ema(todaysecondema2, 20)
  var todayemaout1 = todayema1[todayema1.length - 1]
  var todayemaout2 = todayema2[todayema2.length - 1]
  var todayemaout3 = todayema3[todayema3.length - 1]
  todayouttema = (todayemaout1 - todayemaout2) + todayemaout3
  for (j = allData.length - 21; j < allData.length - 1; j++) {
    arremayesterday.push(allData[j].close)
  }
  yesterdayfirstema1 = ema(arremayesterday, 20)
  for (j = 0; j < 20; j++) {
    yesterdayema1.push(yesterdayfirstema1[j] * 3)
  }
  var yesterdaysecondema2 = ema(yesterdayfirstema1, 20)
  for (k = 0; k < 20; k++) {
    yesterdayema2.push(yesterdaysecondema2[k] * 3)
  }
  yesterdayema3 = ema(yesterdaysecondema2, 20)
  var yesterdayemaout1 = yesterdayema1[yesterdayema1.length - 1]
  var yesterdayemaout2 = yesterdayema2[yesterdayema2.length - 1]
  var yesterdayemaout3 = yesterdayema3[yesterdayema3.length - 1]
  yesterdayouttema = (yesterdayemaout1 - yesterdayemaout2) + yesterdayemaout3
  for (j = allData.length - 22; j < allData.length - 2; j++) {
    arremaereyesterday.push(allData[j].close)
  }
  ereyesterdayfirstema1 = ema(arremaereyesterday, 20)
  for (j = 0; j < 20; j++) {
    ereyesterdayema1.push(ereyesterdayfirstema1[j] * 3)
  }
  var ereyesterdaysecondema2 = ema(ereyesterdayfirstema1, 20)
  for (k = 0; k < 20; k++) {
    ereyesterdayema2.push(ereyesterdaysecondema2[k] * 3)
  }
  ereyesterdayema3 = ema(ereyesterdaysecondema2, 20)
  var ereyesterdayemaout1 = ereyesterdayema1[ereyesterdayema1.length - 1]
  var ereyesterdayemaout2 = ereyesterdayema2[ereyesterdayema2.length - 1]
  var ereyesterdayemaout3 = ereyesterdayema3[ereyesterdayema3.length - 1]
  ereyesterdayouttema = (ereyesterdayemaout1 - ereyesterdayemaout2) + ereyesterdayemaout3

  for (j = allData.length - 23; j < allData.length - 2; j++) {
    arremafreyesterday.push(allData[j].close)
  }
  freyesterdayfirstema1 = ema(arremafreyesterday, 20)
  for (j = 0; j < 20; j++) {
    freyesterdayema1.push(freyesterdayfirstema1[j] * 3)
  }
  var freyesterdaysecondema2 = ema(freyesterdayfirstema1, 20)
  for (k = 0; k < 20; k++) {
    freyesterdayema2.push(freyesterdaysecondema2[k] * 3)
  }
  freyesterdayema3 = ema(freyesterdaysecondema2, 20)
  var freyesterdayemaout1 = freyesterdayema1[freyesterdayema1.length - 1]
  var freyesterdayemaout2 = freyesterdayema2[freyesterdayema2.length - 1]
  var freyesterdayemaout3 = freyesterdayema3[freyesterdayema3.length - 1]
  freyesterdayouttema = (freyesterdayemaout1 - freyesterdayemaout2) + freyesterdayemaout3

  for (j = allData.length - 24; j < allData.length - 2; j++) {
    arremavreyesterday.push(allData[j].close)
  }
  vreyesterdayfirstema1 = ema(arremavreyesterday, 20)
  for (j = 0; j < 20; j++) {
    vreyesterdayema1.push(vreyesterdayfirstema1[j] * 3)
  }
  var vreyesterdaysecondema2 = ema(vreyesterdayfirstema1, 20)
  for (k = 0; k < 20; k++) {
    vreyesterdayema2.push(vreyesterdaysecondema2[k] * 3)
  }
  vreyesterdayema3 = ema(vreyesterdaysecondema2, 20)
  var vreyesterdayemaout1 = vreyesterdayema1[vreyesterdayema1.length - 1]
  var vreyesterdayemaout2 = vreyesterdayema2[vreyesterdayema2.length - 1]
  var vreyesterdayemaout3 = vreyesterdayema3[vreyesterdayema3.length - 1]
  vreyesterdayouttema = (vreyesterdayemaout1 - vreyesterdayemaout2) + vreyesterdayemaout3

  for (j = allData.length - 25; j < allData.length - 2; j++) {
    arremavireyesterday.push(allData[j].close)
  }
  vireyesterdayfirstema1 = ema(arremavireyesterday, 20)
  for (j = 0; j < 20; j++) {
    vireyesterdayema1.push(vireyesterdayfirstema1[j] * 3)
  }
  var vireyesterdaysecondema2 = ema(vireyesterdayfirstema1, 20)
  for (k = 0; k < 20; k++) {
    vireyesterdayema2.push(vireyesterdaysecondema2[k] * 3)
  }
  vireyesterdayema3 = ema(vireyesterdaysecondema2, 20)
  var vireyesterdayemaout1 = vireyesterdayema1[vireyesterdayema1.length - 1]
  var vireyesterdayemaout2 = vireyesterdayema2[vireyesterdayema2.length - 1]
  var vireyesterdayemaout3 = vireyesterdayema3[vireyesterdayema3.length - 1]
  vireyesterdayouttema = (vireyesterdayemaout1 - vireyesterdayemaout2) + vireyesterdayemaout3
  if (smoothe == 1) {
    if (todayouttema >= yesterdayouttema) {
      if (yesterdayouttema < ereyesterdayouttema) {
        console.log('color changed')
        status = 'red to green'

      }
      else {
        console.log('color not changed')
      }
    }
    else {
      if (yesterdayouttema > ereyesterdayouttema) {
        console.log('color changed')
        status = 'green to red'

      }
      else {
        console.log('color not changed')

      }
    }
  }
  else {
    console.log('Smoothe!=1')
  }
  if (smoothe == 2) {
    if (todayouttema > ereyesterdayouttema) {
      first_Indicator = 'green'
    }
    else {
      if (todayouttema <= ereyesterdayouttema) {
        first_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (yesterdayouttema > freyesterdayouttema) {
      second_Indicator = 'green'
    }
    else {
      if (yesterdayouttema <= freyesterdayouttema) {
        second_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (first_Indicator == second_Indicator) {
      console.log('color not changed')
    }
    else {
      if (first_Indicator == 'red' && second_Indicator == 'green') {
        status = 'green to red'
        console.log('color changed')
      }
      else {
        if (first_Indicator == 'green' && second_Indicator == 'red') {
          console.log('color changed')
          status = 'red to green'
        }
      }

    }
  }
  else {
    console.log('Smoothe!=2')
  }
  if (smoothe == 3) {
    if (todayouttema > freyesterdayouttema) {
      first_Indicator = 'green'
    }
    else {
      if (todayouttema <= freyesterdayouttema) {
        first_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (yesterdayouttema > vreyesterdayouttema) {
      second_Indicator = 'green'
    }
    else {
      if (yesterdayouttema <= vreyesterdayouttema) {
        second_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (first_Indicator == second_Indicator) {
      console.log('color not changed')
    }
    else {
      if (first_Indicator == 'red' && second_Indicator == 'green') {
        status = 'green to red'
        console.log('color changed')
      }
      else {
        if (first_Indicator == 'green' && second_Indicator == 'red') {
          console.log('color changed')
          status = 'red to green'
        }
      }

    }
  }
  if (smoothe == 4) {
    if (todayouttema > vreyesterdayouttema) {
      first_Indicator = 'green'
    }
    else {
      if (todayouttema <= vreyesterdayouttema) {
        first_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (yesterdayouttema > vireyesterdayouttema) {
      second_Indicator = 'green'
    }
    else {
      if (yesterdayouttema <= vireyesterdayouttema) {
        second_Indicator = 'red'
      }
      else {
        console.log('color not changed')
      }
    }

    if (first_Indicator == second_Indicator) {
      console.log('color not changed')
    }
    else {
      if (first_Indicator == 'red' && second_Indicator == 'green') {
        status = 'green to red'
        console.log('color changed')
      }
      else {
        if (first_Indicator == 'green' && second_Indicator == 'red') {
          console.log('color changed')
          status = 'red to green'
        }
      }

    }
  }
  let TEMAMAobj = { status: status, average_type: average_type, smoothe: smoothe }
  return TEMAMAobj;
}
var token = '';
let func = async () => {
  // here we need to remove the extra tickers  okay..let me make the list on excel yes you can give me an excel file same as you gave me before
  let data = ["GHSI", "GSV", "SYN", "TRX", "ACST", "ITP", "PTN", "NAK", "ADXS", "GTE", "ASRT", "NSPR", "TLGT", "BIOL", "CSCW", "GPL", "XPL", "CTRM", "CFMS", "OGEN", "KIQ", "NAKD", "DNN", "INUV", "NAOV", "MUX", "ADMP", "NBY", "TBLT", "URG", "HSTO", "SHIP", "DFFN", "UXIN", "AEZS", "TNXP", "AIKI", "MTNB", "BORR", "RGLS", "ONTX", "INPX", "ZSAN", "PTE", "SNDL", "MKD", "BXRX", "CHEK", "CIDM", "ISR", "ASM", "NOVN", "NVCN", "UAMY", "CEI", "MOTS", "HDSN", "ATIF", "POAI", "DYNT", "TXMD", "PULM", "LKCO", "NEPT", "BRQS", "LPCN", "AVGR", "NGD", "ITRM", "NXTD", "TGB", "NMTR", "GNUS", "CCO", "XSPA", "IBIO", "GSAT", "USWS", "VEON", "CLBS", "GERN", "TMBR", "PHUN", "ESGC", "ZOM", "HEPA", "GTT", "ACRX", "DGLY", "TYME", "JFU", "CTXR", "ATHX", "SINT", "CLSN", "JAGX", "CIG", "UEC", "QD", "LYG", "STRM", "TRVN", "CRBP", "BEST", "REI", "TTOO", "HOFV", "HOTH", "TOPS", "DHY", "METX", "NGL", "ABEO", "VTGN", "TGC", "TRCH", "TTI", "ABEV", "MICT", "NBEV", "LAIX", "VTVT", "EXPR", "CHS", "ATOS", "SESN", "BOXL", "LQDA", "IAG", "NAT", "MARK", "OGI", "INFI", "DHF", "KOS", "TELL", "GNW", "LGHL", "WTRH", "IDEX", "VISL", "LLNW", "WTI", "COMS", "CIK", "XXII", "VBIV", "KXIN", "RRD", "SENS", "AHT", "REPH", "SPPI", "QEP", "AKBA", "RIG", "AUUD", "QTT", "UGP", "NXE", "SAN", "TOUR", "MBIO", "DSS", "CPG", "OPTT", "TRXC", "ABUS", "HMY", "ENLC", "EVFM", "IVR", "MREO", "BRFS", "OBSV", "NOK", "JE", "CDEV", "AUY", "MFA", "SWN", "DPW", "BBD", "RIGL", "NYMT", "PAVM", "BTU", "XTNT", "TRVG", "TEF", "WATT", "BTG", "CRNT", "ETM", "BGCP", "OPK", "ITUB", "SRTS", "GGB", "FLDM", "AQMS", "AIV", "SOS", "ERF", "HLX", "ASMB", "TCDA", "AFI", "EFOI", "UUUU", "AREC", "ZIOP", "JG", "CNDT", "AMRX", "BBVA", "LIXT", "DHT", "LTRPA", "AFMD", "MNKD", "BKD", "SVM", "SIRI", "SID", "GLOG", "EXK", "CLNY", "CBAT", "CLVS", "SAND", "HMHC", "WIT", "WWR", "CERS", "SOLO", "KGC", "VET", "ALTO", "HL", "SBS", "CX", "ENBL", "MGI", "AMRN", "FRSX", "EBON", "HEXO", "KNDI", "AQB", "AGI", "VXRT", "AYRO", "CXW", "GEO", "TWO", "ETRN", "PSEC", "ZIXI", "PTEN", "CVE", "TV", "KALA", "GPRO", "FSM", "UWMC", "ASX", "ADT", "ET", "COTY", "MOGO", "GEL", "PBR", "ENDP", "AMC", "UAVS", "GFI", "FTI", "MBT", "EQX", "WIMI", "SILV", "NLY", "NG", "KOPN", "PAA", "PBI", "PAGP", "KODK", "DVAX", "ERJ", "AM", "BCS", "LOTZ", "AR", "CDE", "IRWD", "PGRE", "CGEN", "WPRT", "CLOV", "KMPH", "NPTN", "RRC", "SRNE", "GEVO", "PVG", "BNGO", "UMC", "INFN", "NNDM", "TWLVU", "CFII", "OR", "MACQU", "BB", "SBEAU", "DRH", "NRZ", "CRDF", "RUBY", "SLAMU", "CRON", "EGO", "PCG", "ACB", "AUVI", "HEC", "TEVA", "BCRX", "SRNGU", "ING", "AACQ", "AMCR", "OCGN", "SHLX", "ALUS", "MRO", "INO", "ZNGA", "SGMO", "NGAC", "CIM", "SDC", "AJAX", "SFTW", "F", "RTP", "EAF", "FNB", "ACIC", "UNIT", "RAAC", "GSAH", "ATNX", "MTG", "NYCB", "BDN", "DB", "FOLD", "LUMN", "RMO", "QRTEA", "GLUU", "ERIC", "GE", "CNX", "FRX", "AMX", "GOEV", "MAC", "CLNE", "SUNW", "SHO", "VG", "CLF", "ISBC", "HIMX", "ROOT", "BTWN", "IPOF", "AMRS", "KPTI", "NPA", "SM", "KAR", "CDXC", "HOL", "AUPH", "NBLX", "XL", "SSRM", "PBF", "APLE", "PRMW", "DOYU", "TWNK", "CS", "HPE", "COMM", "INSG", "VLDR", "SABR", "KMI", "VTRS", "MVIS", "CBD", "GTES", "MIK", "LU", "SY", "RLGY", "NOV", "HYLN", "CAN", "M", "BFT", "HBAN", "MDRX", "UBS", "CCJ", "SKT", "SLM", "MOMO", "GPK", "AGNC", "CLDR", "WKHS", "ACI", "VIAV", "FHN", "MUR", "STLA", "GMBL", "HST", "X", "IBN", "WES", "ABR", "KOSS", "TAK", "GT", "VALE", "FCEL", "DOC", "BPY", "INFY", "FLR", "VOD", "VST", "RLX", "YSG", "HBI", "GHVI", "EQT", "APHA", "PBCT", "AG", "ESI", "NKLA", "FLEX", "UA", "TGNA", "IGT", "KIM", "TROX", "SBSW", "BOX", "IPOE", "JBLU", "COG", "LTHM", "SVMK", "GOLD", "LAC", "CYTK", "VUZI", "EQNR", "BFLY", "HRB", "FEYE", "ORI", "RIDE", "CNP", "NLOK", "WISH", "BRX", "APA", "SU", "EB", "MFC", "AU", "DM", "KEY", "MAT", "OUT", "RDN", "WEN"];
 let d = new Date();
  let todayDate = formatDate(d);
  let oldDate = formatDate(d.setDate(d.getDate() - 1500));

  let iterator = 0;
  let increased_tickers = [];
  var interval = setAsyncInterval(async fetchData => {
    var ticker = {};
    var lastdate;
    let latestData;
    let allData;
    try {
      let latestResponse;
      try {
        latestResponse = await fetch(
          `https://api.tiingo.com/tiingo/daily////${data[iterator]}/prices?token=${token}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
        });
        latestData = await latestResponse.json();
        if (latestData.detail == 'Error: You have run over your monthly bandwidth allocation. Please upgrade at https://api.tiingo.com/pricing to have your limits increased.') {
          token = ''
          func();
        }
      }
      catch (err) {
        console.log('caching')
        console.log(err)
      }

      if (latestData.length > 0) {

        let historicalResponse;
        try {
          historicalResponse = await fetch(
            `https://api.tiingo.com/tiingo/daily////${data[iterator]}/prices?startDate=${oldDate}&endDate=${latestData[0].date}&token=${token}`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
          });
          allData = await historicalResponse.json();
          for (var i = 0; i < allData.length; i++) {
            if (allData[i].date.getTime > allData[i + 1].date.getTime) {
              lastdate = allData[i].date.getTime

            }
          }
          if (allData.length == 0) {
            console.log('allData have zero length')
          }
        }
        catch (err) {
          console.log(typeof (err))
        }

        for (const smoothe of [1, 2, 3, 4]) {
          let dbstatus1 = await SMA(allData, latestData, smoothe)
          let ticker = { date: latestData[0].date, ticker: data[iterator], status: dbstatus1.status, closed_price: latestData[0].close, average_type: dbstatus1.average_type, smoothe: dbstatus1.smoothe }
          if (ticker.status == '') {
            console.log('no status found')
          }
          else {
            console.log('Pushing ticker 1', ticker, increased_tickers.length)
            increased_tickers.push(ticker);
            storedb(ticker);
          }
          let dbstatus2 = await EMA(allData, latestData, smoothe)
          ticker = { date: latestData[0].date, ticker: data[iterator], status: dbstatus2.status, closed_price: latestData[0].close, average_type: dbstatus2.average_type, smoothe: dbstatus2.smoothe }
          if (ticker.status == '') {
            console.log('no status found')
          }
          else {
            console.log('Pushing ticker 2', ticker, increased_tickers.length)
            increased_tickers.push(ticker);
            storedb(ticker);
          }
          let dbstatus3 = await WMA(allData, latestData, smoothe)
          ticker = { date: latestData[0].date, ticker: data[iterator], status: dbstatus3.status, closed_price: latestData[0].close, average_type: dbstatus3.average_type, smoothe: dbstatus3.smoothe }
          if (ticker.status == '') {
            console.log('no status found')
          }
          else {
            console.log('Pushing ticker 3', ticker, increased_tickers.length)
            increased_tickers.push(ticker);
            storedb(ticker);
          }
          let dbstatus4 = await VWMA(allData, latestData, smoothe)
          ticker = { date: latestData[0].date, ticker: data[iterator], status: dbstatus4.status, closed_price: latestData[0].close, average_type: dbstatus4.average_type, smoothe: dbstatus4.smoothe }
          if (ticker.status == '') {
            console.log('no status found')
          }
          else {
            console.log('Pushing ticker 4', ticker, increased_tickers.length)
            increased_tickers.push(ticker);
            storedb(ticker);
          }
          let dbstatus5 = await HULLMA(allData, latestData, smoothe)
          ticker = { date: latestData[0].date, ticker: data[iterator], status: dbstatus5.status, closed_price: latestData[0].close, average_type: dbstatus5.average_type, smoothe: dbstatus5.smoothe }
          if (ticker.status == '') {
            console.log('no status found')
          }
          else {
            console.log('Pushing ticker 5', ticker, increased_tickers.length)
            increased_tickers.push(ticker);
            storedb(ticker);
          }
          let dbstatus6 = await funtema(allData, latestData, smoothe)
          ticker = { date: latestData[0].date, ticker: data[iterator], status: dbstatus6.status, closed_price: latestData[0].close, average_type: dbstatus6.average_type, smoothe: dbstatus6.smoothe }
          if (ticker.status == '') {
            console.log('no status found')
          }
          else {
            console.log('Pushing ticker 6', ticker, increased_tickers.length)
            increased_tickers.push(ticker);
            storedb(ticker);
          }
          // }
        }
      } else {
        console.log('No Data in first api');
      }
    } catch (error) {
      console.error(error);
    }
    console.log('at the end of set interval', increased_tickers.length)
    iterator = iterator + 1;
    if (iterator == data.length) {
      //keep only max date records
      let max_date = new Date(Math.max(...increased_tickers.map(e => new Date(e.date))));
      increased_tickers = increased_tickers.filter((obj) => {
        return new Date(obj.date).toString() == new Date(max_date).toString();
      });
      clearAsyncInterval(interval);
      // console.log('iterator cleared')
      let email_html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Ticker</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
        <script src="https://www.w3schools.com/lib/w3.js"></script>
       
      </head>
      <body  onload="get_fn()">
      
      <div class="container">
        
          <table class="table">
              <thead class="thead-dark">
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Ticker</th>
                  <th scope="col">Status</th>
                  <th scope="col">Closed Price</th>
                  <th scope="col">Average_type</th>
                  <th scope="col">Smoothe</th>
                </tr>
              </thead>
              <tbody>`;
      for (const ticker of increased_tickers) {
        email_html += `<tr>
                <th scope="row">${ticker.date}</th>
                <td>${ticker.ticker}</td>
                <td>${ticker.status}</td>
                <td>${ticker.closed_price}</td>
                <td>${ticker.average_type}</td>
                <td>${ticker.smoothe}</td>
              </tr>`
      }
      email_html += `</tbody>
            </table>
            </div>  
      </body>
      </html>`
      //Send email here
      // setup e-mail data with unicode symbols
      var mailOptions = {
        from: '"Tickers changed ?" <no-reply@tickers.com>', // sender address
        to: '', // list of receivers( , separated here)
        subject: 'New York Stock Exchange Smoothing CMultimate MA', // Subject line
        html: email_html // html body

      };
      // send mail with defined transport object
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log(error);
        }
        increased_tickers = []
        console.log(mailOptions)
        console.log('Message sent: ' + info.response);

      });
    }
  }, 23000);

}
func();

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;

  return [year, month, day].join('-');
}
