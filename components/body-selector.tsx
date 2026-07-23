"use client"

import type React from "react"

import { useEffect, useRef, useCallback, useState } from "react"

interface BodySelectorProps {
  onSelectBodyPart: (bodyPart: string[]) => void
  selectedBodyPart?: string[]
}

// Map of ID elements and their base names
const bodyPartMap: Record<string, string> = {
  // Left side
  face_left: "face_left",
  "face_left-2": "face_left",
  head_left: "head_left",
  "head_left-2": "head_left",
  neck_left: "neck_left",
  "neck_left-2": "neck_left",
  shoulder_left: "shoulder_left",
  chest_left: "chest_left",
  "chest_left-2": "chest_left",
  upper_arm_left: "upper_arm_left",
  "upper_arm_left-2": "upper_arm_left",
  "upper_arm_left-3": "upper_arm_left",
  forearm_left: "forearm_left",
  "forearm_left-2": "forearm_left",
  side_left: "side_left",
  "side_left-2": "side_left",
  "side_left-3": "side_left",
  hip_left: "hip_left",
  "hip_left-2": "hip_left",
  buttocks_left: "buttocks_left",
  "buttocks_left-2": "buttocks_left",
  thigh_left: "thigh_left",
  "thigh_left-2": "thigh_left",
  "thigh_left-3": "thigh_left",
  calf_left: "calf_left",
  "calf_left-2": "calf_left",
  "calf_left-3": "calf_left",
  hand_left: "hand_left",
  "hand_left-2": "hand_left",
  "hand_left-3": "hand_left",
  foot_left: "foot_left",
  "foot_left-2": "foot_left",
  "foot_left-3": "foot_left",

  // Right side
  face_right: "face_right",
  "face_right-2": "face_right",
  head_right: "head_right",
  "head_right-2": "head_right",
  neck_right: "neck_right",
  "neck_right-2": "neck_right",
  shoulder_right: "shoulder_right",
  chest_right: "chest_right",
  "chest_right-2": "chest_right",
  upper_arm_right: "upper_arm_right",
  "upper_arm_right-2": "upper_arm_right",
  "upper_arm_right-3": "upper_arm_right",
  forearm_right: "forearm_right",
  "forearm_right-2": "forearm_right",
  side_right: "side_right",
  "side_right-2": "side_right",
  "side_right-3": "side_right",
  hip_right: "hip_right",
  "hip_right-2": "hip_right",
  buttocks_right: "buttocks_right",
  "buttocks_right-2": "buttocks_right",
  thigh_right: "thigh_right",
  "thigh_right-2": "thigh_right",
  "thigh_right-3": "thigh_right",
  calf_right: "calf_right",
  "calf_right-2": "calf_right",
  "calf_right-3": "calf_right",
  hand_right: "hand_right",
  "hand_right-2": "hand_right",
  "hand_right-3": "hand_right",
  foot_right: "foot_right",
  "foot_right-2": "foot_right",
  "foot_right-3": "foot_right",

  // Central parts
  back_center: "back_center",
  "back_center-3": "back_center",
  groin: "groin",
  "groin-2": "groin",
  "groin-3": "groin",
  underboob: "underboob",
  "underboob-2": "underboob",
  "underboob-3": "underboob",
}

// Reverse map to obtain all IDs by base name
const getRelatedIds = (baseId: string): string[] => {
  return Object.entries(bodyPartMap)
    .filter(([_, value]) => value === baseId)
    .map(([key, _]) => key)
}

export default function BodySelector({ onSelectBodyPart, selectedBodyPart = [] }: BodySelectorProps) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const [svgsLoaded, setSvgsLoaded] = useState({
    front: false,
    back: false,
    left: false,
    right: false,
  })

  const selectedBodyPartRef = useRef<string[]>(selectedBodyPart)

  // Update ref when props change
  useEffect(() => {
    selectedBodyPartRef.current = selectedBodyPart
  }, [selectedBodyPart])

  const handleBodyPartClick = useCallback(
    (id: string) => {
      const basePart = bodyPartMap[id] || id
      const currentSelections = [...selectedBodyPartRef.current]
      const currentBaseSelections = currentSelections.map((p) => bodyPartMap[p] || p)
      const isSelected = currentBaseSelections.includes(basePart)

      if (isSelected) {
        const newSelection = currentSelections.filter((p) => (bodyPartMap[p] || p) !== basePart)
        onSelectBodyPart(newSelection)
      } else {
        onSelectBodyPart([...currentSelections, id])
      }
    },
    [onSelectBodyPart],
  )

  // Function for uploading SVG
  const loadSvg = async (url: string, ref: React.RefObject<HTMLDivElement>, viewType: string) => {
    try {
      const response = await fetch(url)
      const svgText = await response.text()

      if (ref.current) {
        ref.current.innerHTML = svgText

        // Function for uploading SVG
        const svgElement = ref.current.querySelector("svg")
        if (svgElement) {
          // Find all clickable elements (usually path or g elements with classes)
          const clickableElements = svgElement.querySelectorAll('*[id], *[class*="cls"], path, g')

          clickableElements.forEach((element) => {
            const el = element as SVGElement

            // Add a class for styling if it does not exist
            if (el.id || el.classList.contains("cls") || el.tagName === "path") {
              el.classList.add("body-part")

              // Add a click handler
              el.addEventListener("click", (e) => {
                e.stopPropagation()
                const id = el.id || el.getAttribute("data-name") || ""
                if (id && bodyPartMap[id]) {
                  handleBodyPartClick(id)
                }
              })
            }
          })
        }

        setSvgsLoaded((prev) => ({ ...prev, [viewType]: true }))
      }
    } catch (error) {
      console.error(`Error loading SVG for ${viewType}:`, error)
    }
  }

  // Uploading SVG files
  useEffect(() => {
    loadSvg("/body-parts/front-view.svg", frontRef, "front")
    loadSvg("/body-parts/back-view.svg", backRef, "back")
    loadSvg("/body-parts/left-view.svg", leftRef, "left")
    loadSvg("/body-parts/right-view.svg", rightRef, "right")
  }, [])

  // Updating selected classes
  useEffect(() => {
    if (!svgsLoaded.front && !svgsLoaded.back && !svgsLoaded.left && !svgsLoaded.right) return

    const refs = [frontRef, backRef, leftRef, rightRef]

    refs.forEach((ref) => {
      if (ref.current) {
        const svgElement = ref.current.querySelector("svg")
        if (svgElement) {
          // Remove the selected class from all elements
          const bodyParts = svgElement.querySelectorAll(".body-part.selected")
          bodyParts.forEach((part) => {
            part.classList.remove("selected")
          })

          // Add the selected class only to selected elements
          if (selectedBodyPart && selectedBodyPart.length > 0) {
            const selectedBaseParts = selectedBodyPart.map((id) => bodyPartMap[id] || id)
            const allSelectedIds = new Set<string>()

            selectedBaseParts.forEach((basePart) => {
              getRelatedIds(basePart).forEach((id) => {
                allSelectedIds.add(id)
              })
            })

            allSelectedIds.forEach((id) => {
              const selectedPart = svgElement.querySelector(`#${id}`) || svgElement.querySelector(`[data-name="${id}"]`)
              if (selectedPart && selectedPart.classList.contains("body-part")) {
                selectedPart.classList.add("selected")
              }
            })
          }
        }
      }
    })
  }, [selectedBodyPart, svgsLoaded])

  return (
    <div className="body-selector">
      {/* All body views in a grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full max-w-6xl mx-auto">
        {/* Left view */}
        <div className="flex flex-col items-center">
          <div ref={leftRef} className="w-full h-[300px] flex justify-center items-center" />
        </div>

        {/* Front view */}
        <div className="flex flex-col items-center">
          <div ref={frontRef} className="w-full h-[300px] flex justify-center items-center" />
        </div>

        {/* Back view */}
        <div className="flex flex-col items-center">
          <div ref={backRef} className="w-full h-[300px] flex justify-center items-center" />
        </div>

        {/* Right view */}
        <div className="flex flex-col items-center">
          <div ref={rightRef} className="w-full h-[300px] flex justify-center items-center" />
        </div>
      </div>

      {/* Custom CSS for highlighting selected parts */}
      <style jsx global>{`
        .body-part {
          cursor: pointer;
          transition: fill 0.1s ease;
          fill: white !important;
          stroke: #ccc;
          stroke-width: 1;
        }
        .body-part:hover {
          fill: #dfdfdf !important;
        }
        .body-part.selected {
          fill: #666666 !important;
        }
        svg {
          max-width: 120px;
          max-height: 300px;
          width: auto;
          height: auto;
        }
      `}</style>
    </div>
  )
}
