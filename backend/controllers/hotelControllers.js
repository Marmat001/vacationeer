import Hotel from '../models/hotelModel'
import fs from 'fs'
import Order from '../models/orderModel'
import User from '../models/userModel'

export const create = async (req, res) => {
  try {
    const fields = req.fields
    const files = req.files

    const hotel = new Hotel(fields)
    hotel.postedBy = req.user._id

    if (files.image) {
      hotel.image.data = fs.readFileSync(files.image.path)
      hotel.image.contentType = files.image.type
    }

    hotel.save((error, result) => {
      if (error) {
        console.log('saving hotel error ===>', error)
        res.status(400).send('Error saving')
      }

      res.json(result)
    })
  } catch (error) {
    console.log(error)
    res.status(400).json({
      error: error.message,
    })
  }
}

// export const hotels = async (req, res) => {
//   const allHotels = await Hotel.find({ from: { $gte: new Date() } })
//     .limit(24)
//     .select('-image.data')
//     .populate('postedBy', '_id name')
//     .exec()
//   res.json(allHotels)
// }

export const hotels = async (req, res) => {
  const { page } = req.body
  const currentPage = page || 1
  const perPage = 15
  const allHotels = await Hotel.find({ from: { $gte: new Date() } })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .select('-image.data')
    .populate('postedBy', '_id name')
    .exec()
  res.json(allHotels)
}


export const image = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).exec()
  if (hotel && hotel.image && hotel.image.data !== null) {
    res.set('Content-Type', hotel.image.contentType)
    return res.send(hotel.image.data)
  }
}

export const hotelsSeller = async (req, res) => {
  const { page } = req.body

  const currentPage = page || 1
  const perPage = 6
  const allHotels = await Hotel.find({ postedBy: req.user._id })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .select('-image.data')
    .populate('postedBy', '_id name')
    .exec()

  res.send(allHotels)
}

export const hotelOwner = async (req, res, callback) => {
  const hotel = await Hotel.findById(req.params.hotelId).exec()
  const owner = hotel.postedBy._id.toString() === req.user._id.toString()

  if (!owner) {
    return res.status(403).send('Unauthorized')
  }

  callback()
}

export const remove = async (req, res) => {
  const deleted = await Hotel.findByIdAndDelete(req.params.hotelId)
    .select('-image.data')
    .exec()

  res.json(deleted)
}

export const read = async (req, res) => {
  const hotel = await Hotel.findById(req.params.hotelId)
    .populate('postedBy', '_id name')
    .select('-image.data')
    .exec()

  res.json(hotel)
}

export const update = async (req, res) => {
  try {
    const fields = req.fields
    const files = req.files

    let data = { ...fields }

    if (files.image) {
      let image = {}
      image.data = fs.readFileSync(files.image.path)
      image.contentType = files.image.type

      data.image = image
    }

    const updated = await Hotel.findByIdAndUpdate(req.params.hotelId, data, {
      new: true,
    }).select('-image.data')

    res.json(updated)
  } catch (error) {
    console.log(error)
    res.status(400).send('Hotel update failed. Try again.')
  }
}

export const userHotelBookings = async (req, res) => {
  const allOrders = await Order.find({ orderedBy: req.user._id })
    .select('session')
    .populate('hotel', '-image.data')
    .populate('orderedBy', '_id name')
    .exec()

  res.json(allOrders)
}

export const isAlreadyBooked = async (req, res) => {
  const { hotelId } = req.params
  const userOrders = await Order.find({ orderedBy: req.user._id })
    .select('hotel')
    .exec()
  let ids = []
  for (let i = 0; i < userOrders.length; i++) {
    ids.push(userOrders[i].hotel.toString())
  }
  res.json({
    ok: ids.includes(hotelId),
  })
}

const handleSearch = async (req, res, location, date) => {
  const fromDate = date.split(',')
  const result = await Hotel.find({
    from: { $gte: new Date(fromDate[0]) },
    location,
  })
    .select('-image.data')
    .exec()

  res.json(result)

  //more specific search but not enough hotels for this to give a good user experience
  // const result = await Hotel.find({
  //   from: { $gte: new Date() },
  //   to: { $lte: date.to },
  //   location,
  //   bed,
  // })
  //   .select('-image.data')
  //   .exec()

  // res.json(result)
}

const handlePrice = async (req, res, price) => {
  try {
    let hotels = await Hotel.find({
      price: {
        $gte: price[0],
        $lte: price[1],
      },
    })
      .limit(15)
      .select('-image.data')
      .populate('postedBy', '_id name')
      .exec()

    res.json(hotels)
  } catch (error) {
    console.log(error)
  }
}

const handleStar = (req, res, stars) => {
  Hotel.aggregate([
    {
      $project: {
        document: '$$ROOT',
        floorAverage: {
          $floor: { $avg: '$ratings.star' },
        },
      },
    },
    { $match: { floorAverage: stars } },
  ])
    .limit(15)
    .exec((err, aggregates) => {
      if (err) console.log('AGGREGATE ERROR', err)
      Hotel.find({ _id: aggregates })
        .select('-image.data')
        .populate('postedBy', '_id name')
        .exec((error, hotels) => {
          if (error) console.log('HOTEL AGGREGATE ERROR', error)
          res.json(hotels)
        })
    })
}

export const searchFilters = async (req, res) => {
  const { location, date, bed, price, stars } = req.body

  if (location || date || bed) {
    await handleSearch(req, res, location, date)
  }

  if (price !== undefined) {
    await handlePrice(req, res, price)
  }

  if (stars) {
    console.log(stars)
    await handleStar(req, res, stars)
  }
}

export const hotelsCount = async (req, res) => {
  let total = await Hotel.find({}).estimatedDocumentCount().exec()
  res.json(total)
}

export const hotelStar = async (req, res) => {
  const hotel = await Hotel.findById(req.params.hotelId).exec()
  const user = await User.findOne({ _id: req.user._id }).exec()
  const { star } = req.body

  const existingRatingObject = hotel.ratings.find(
    (ele) => ele.postedBy.toString() === user._id.toString()
  )

  if (existingRatingObject === undefined) {
    const ratingAdded = await Hotel.findByIdAndUpdate(
      hotel._id,
      {
        $push: { ratings: { star, postedBy: user._id } },
      },
      { new: true }
    ).exec()
    console.log('ratingAdded', ratingAdded)
    res.json(ratingAdded)
  } else {
    const ratingUpdated = await Hotel.updateOne(
      {
        ratings: { $elemMatch: existingRatingObject },
      },
      { $set: { 'ratings.$.star': star } },
      { new: true }
    ).exec()
    console.log('ratingUpdated', ratingUpdated)
    res.json(ratingUpdated)
  }
}
