"use client"

import { useState, useEffect } from "react"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import { getBanners } from "../api/index"
import PlaceholderImage from "./PlaceholderImage"

const Banner = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await getBanners()
        setBanners(response.data.data)
      } catch (error) {
        console.error("Error fetching banners:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
        },
      },
    ],
  }

  if (loading) {
    return (
      <div className="h-[400px] md:h-[500px] bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-400">Loading banners...</div>
      </div>
    )
  }

  if (banners.length === 0) {
    return (
      <div className="h-[400px] md:h-[500px] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">No banners available</div>
      </div>
    )
  }

  return (
    <div className="banner-slider">
      <Slider {...settings}>
        {banners.map((banner) => (
          <div key={banner.id} className="relative h-[400px] md:h-[500px]">
            {banner.imageUrl ? (
              <img
                src={banner.imageUrl || "/placeholder.svg"}
                alt={banner.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none"
                  e.target.nextSibling.style.display = "flex"
                }}
              />
            ) : null}
            <PlaceholderImage
              text={banner.name}
              className="w-full h-full"
              style={{ display: banner.imageUrl ? "none" : "flex" }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="text-center text-white px-4">
                {/* <h2 className="text-3xl md:text-4xl font-bold mb-2">{banner.name}</h2>
                <p className="text-lg md:text-xl">Explore amazing destinations</p> */}
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  )
}

export default Banner
