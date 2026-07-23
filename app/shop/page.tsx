"use client"

import { useState } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ScrollIndicators from "@/components/scroll-indicators"
import { CornerRightDown, ShoppingCart, X } from "lucide-react"
import InstagramSection from "@/components/instagram-section"

const shopItems = [
  {
    id: 1,
    name: "Product 1",
    price: 5,
    description:
      "Your description",
    image: "/shop/example.jpg",
    shopLink: "https://yourshopdomain.com/flash-set-1",
  },
  {
    id: 2,
    name: "Product 2",
    price: 100,
    description:
      "Your description",
    image: "/shop/example.jpg",
    shopLink: "https://yourshopdomain.com/stencil-pack-2",
  },
  {
    id: 3,
    name: "Product 3",
    price: 500,
    description:
      "Your description",
    image: "/shop/example.jpg",
    shopLink: "https://yourshopdomain.com/geometric-collection-3",
  },
]

export default function Shop() {
  const [selectedItem, setSelectedItem] = useState(null)

  // Reusable component for full-width separator lines
  const SeparatorLine = () => (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-px bg-neutral-600 mb-16"></div>
  )

  // Reusable component for main content text
  const MainContentText = ({ children, className = "" }) => (
    <p className={`text-4xl md:text-6xl font-light leading-none ${className}`}>{children}</p>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-x-hidden">
      <ScrollIndicators />
      <Header />

      <main className="flex-1">
        {/* Shop Header Section */}
        <section className="relative min-h-screen text-white px-12 pb-16 pt-32 flex flex-col justify-center">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/shop.jpg"
              alt="Tattoo shop background"
              fill
              className="object-cover opacity-20 blur-lg"
              priority
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>

          <div className="relative z-10 w-full">
            <div className="mb-32">
              <div className="mb-16">
                <p className="text-xl font-bold leading-none mb-16">
                  Digital tattoo
                  <br />
                  tool shop.
                </p>

                <SeparatorLine />

                <div className="w-full mb-24">
                  <MainContentText className="mb-16">
                    <span className="ml-24">Browse our partner's</span> collection of merchandise of top-notch tattoo
                    designs, flash sheets and stencils. Each piece is carefully crafted to inspire artists and clients.
                  </MainContentText>
                </div>

                <SeparatorLine />

                <div className="w-full mb-24">
                  <MainContentText>
                    <span className="ml-24">All products available</span> are thoroughly tested and of the best quality.
                    Ideal for tattoo artists who want the best tools for the job.
                  </MainContentText>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="min-h-screen bg-black text-white px-4 sm:px-8 md:px-12 py-16 relative">
          <div className="flex">
            {/* Left Sidebar - Product Details */}
            <div
              className={`fixed left-0 top-0 h-full w-96 bg-black text-white p-8 z-[60] transform transition-transform duration-300 ease-in-out border-r border-neutral-600 ${
                selectedItem ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {selectedItem && (
                <>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="mb-6 pt-8">
                    <Image
                      src={selectedItem.image || "/placeholder.svg"}
                      alt={selectedItem.name}
                      width={400}
                      height={300}
                      className="object-cover w-full h-48 mb-4"
                    />
                  </div>

                  <h2 className="text-2xl font-bold mb-4">{selectedItem.name}</h2>
                  <p className="text-3xl mb-6">€{selectedItem.price}</p>

                  <div className="text-neutral-300 mb-8 leading-relaxed">
                    <p>{selectedItem.description}</p>
                  </div>

                  <a
                    href={selectedItem.shopLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-black hover:bg-white hover:text-black text-white font-bold py-4 px-6 flex items-center justify-center gap-2 transition-colors duration-300 border border-neutral-600"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    BUY NOW
                  </a>
                </>
              )}
            </div>

            {/* Main Content */}
            <div className={`w-full transition-all duration-300 ease-in-out ${selectedItem ? "ml-96" : "ml-0"}`}>
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-2 mb-8">
                  <p className="text-lg font-bold">Partner's Collection</p>
                  <CornerRightDown className="w-5 h-5" />
                </div>
                <h2 className="text-6xl md:text-8xl font-light leading-none mb-16">
                  Most popular
                  <br />
                  products
                </h2>
              </div>

              <SeparatorLine />

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {shopItems.map((item) => (
                  <div key={item.id} className="group cursor-pointer" onClick={() => setSelectedItem(item)}>
                    <div className="relative overflow-hidden mb-4">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={400}
                        height={500}
                        className="object-cover w-full h-[300px] group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-lg font-bold">View Details</p>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-2xl">€{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Section */}
        <InstagramSection />
      </main>

      {/* Overlay for sidebar */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[55]" onClick={() => setSelectedItem(null)} />
      )}

      <Footer />
    </div>
  )
}
