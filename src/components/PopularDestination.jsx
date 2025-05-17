import { Link } from "react-router-dom"

const destinations = [
  {
    id: 1,
    name: "Bali",
    country: "Indonesia",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80",
    rating: 4.8,
    reviews: 1024,
  },
  {
    id: 2,
    name: "Paris",
    country: "France",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80",
    rating: 4.7,
    reviews: 896,
  },
  {
    id: 3,
    name: "Santorini",
    country: "Greece",
    image:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    rating: 4.9,
    reviews: 768,
  },
  {
    id: 4,
    name: "Tokyo",
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80",
    rating: 4.6,
    reviews: 512,
  },
]

const PopularDestination = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#FF7757] mb-2 text-right">Popular Destinations</h2>
          <p className="text-gray-600 text-right max-w-2xl ml-auto">
            Most popular destinations around the world, from historical places to natural wonders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination) => (
            <div
              key={destination.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="relative h-64">
                <img
                  src={destination.image || "/placeholder.svg"}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.parentNode.classList.add("placeholder-image")
                    e.target.parentNode.innerHTML = `<div class="text-center p-4"><p class="font-medium">${destination.name}</p></div>`
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-bold">{destination.name}</h3>
                  <p>{destination.country}</p>
                </div>
              </div>

              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="ml-1 text-gray-700">{destination.rating}</span>
                </div>
                <span className="text-sm text-gray-500">{destination.reviews} reviews</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/destination"
            className="px-6 py-3 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] transition-colors"
          >
            View All Destinations
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PopularDestination
