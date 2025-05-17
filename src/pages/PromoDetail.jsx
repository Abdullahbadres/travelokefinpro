"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { getPromoById } from "../api"
import PlaceholderImage from "../components/PlaceholderImage"
import toast from "react-hot-toast"

const PromoDetail = () => {
  const { id } = useParams()
  const [promo, setPromo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        setLoading(true)
        const response = await getPromoById(id)
        setPromo(response.data.data)
      } catch (error) {
        console.error("Error fetching promo:", error)
        toast.error("Failed to fetch promo details")
      } finally {
        setLoading(false)
      }
    }

    fetchPromo()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!promo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">Promo not found</p>
          <Link to="/" className="inline-block px-6 py-3 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242]">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 md:h-96">
          {promo.imageUrl ? (
            <img
              src={promo.imageUrl || "/placeholder.svg"}
              alt={promo.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
          ) : null}
          <PlaceholderImage
            text={promo.title}
            className="w-full h-full"
            style={{ display: promo.imageUrl ? "none" : "flex" }}
          />

          {/* Promo badge */}
          <div className="absolute top-4 left-4 bg-[#FF7757] text-white px-4 py-2 rounded-full text-lg font-medium">
            {promo.promo_code}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{promo.title}</h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
              Save Rp{promo.promo_discount_price.toLocaleString()}
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Min. purchase: Rp{promo.minimum_claim_price.toLocaleString()}
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{promo.description}</p>
          </div>

          <div className="prose max-w-none mb-8">
            <h3 className="text-xl font-semibold mb-2">Terms & Conditions</h3>
            <div className="text-gray-700 whitespace-pre-line">
              {promo.terms_condition || "No terms and conditions specified."}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link to="/" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              Back to Home
            </Link>
            <button
              onClick={() => {
                navigator.clipboard.writeText(promo.promo_code)
                toast.success("Promo code copied to clipboard!")
              }}
              className="px-6 py-3 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242]"
            >
              Copy Promo Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromoDetail
