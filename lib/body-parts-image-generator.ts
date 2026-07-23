import { createCanvas, loadImage } from "@napi-rs/canvas"
import fs from "fs"
import path from "path"

// Body parts mapping
const BODY_PARTS_MAPPING: Record<string, string> = {
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

// Function to find the correct public path
function findPublicPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), "public", "body-parts"),
    path.join(process.cwd(), "..", "public", "body-parts"),
    path.join(__dirname, "..", "..", "public", "body-parts"),
    path.join(__dirname, "..", "..", "..", "public", "body-parts"),
    "./public/body-parts",
    "../public/body-parts",
  ]

  for (const testPath of possiblePaths) {
    console.log(`Testing path: ${testPath}`)
    if (fs.existsSync(testPath)) {
      console.log(`Found valid path: ${testPath}`)
      return testPath
    }
  }

  throw new Error("Could not find public/body-parts directory")
}

// Convert SVG to PNG buffer
async function svgToPng(svgContent: string, width: number, height: number): Promise<Buffer> {
  try {
    // Try to use sharp if available
    const sharp = await import('sharp')
    const svgBuffer = Buffer.from(svgContent, 'utf8')
    const pngBuffer = await sharp.default(svgBuffer)
     .resize(width, height, {
       fit: "contain",
       background: { r: 0, g: 0, b: 0, alpha: 0 }
     })
     .png()
     .toBuffer()

    return pngBuffer
  } catch (error) {
    console.error("Sharp not available, using fallback method")
    // Fallback: create a simple colored rectangle
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    // Draw a placeholder
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = "#cccccc"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)

    ctx.fillStyle = "#666666"
    ctx.font = "16px Arial"
    ctx.textAlign = "center"
    ctx.fillText("SVG Preview", width / 2, height / 2)

    return canvas.toBuffer("image/png")
  }
}

// Highlight selected parts in SVG.
//
// This used to parse the SVG with jsdom and add a `.highlighted` class to each
// matching element, but jsdom pulls in an ESM-only transitive dependency
// (@exodus/bytes) that breaks `require()` in the Vercel serverless runtime.
// Instead we inject a <style> block that targets the relevant ids directly —
// no DOM parsing, same visual result (sharp already renders CSS in the SVG).
function highlightSvgParts(svgContent: string, selectedParts: string[]): string {
  try {
    // Reduce each selected part to its base body-part name (strip a trailing -N).
    // A single body part is split across several path ids in the SVGs
    // (e.g. chest_left + chest_left-2) and the same region is named inconsistently
    // between views (front: chest_left-2, left: chest_left-2, right: chest_right),
    // so we match on the base name and highlight the whole id family.
    const baseNames = [
      ...new Set(
        selectedParts
          .map((part) => (BODY_PARTS_MAPPING[part] || part).replace(/-\d+$/, ""))
          .filter(Boolean),
      ),
    ]
    console.log(`Highlighting base parts: ${baseNames.join(", ")}`)

    if (baseNames.length === 0) return svgContent

    // For each base name, match the exact id (`chest_left`) and the whole id
    // family (`chest_left-2`, `chest_left-3`, …) via an attribute-prefix selector.
    const selector = baseNames
      .flatMap((base) => [`[id="${base}"]`, `[id^="${base}-"]`])
      .join(", ")

    const styleBlock = `<style>
      ${selector} {
        fill: rgba(255, 0, 0, 0.4) !important;
        stroke: #ff0000 !important;
        stroke-width: 2px !important;
      }
    </style>`

    // Insert the style just before the closing </svg> tag so it lives inside
    // the SVG root. Fall back to the original content if there's no </svg>.
    const closingIndex = svgContent.lastIndexOf("</svg>")
    if (closingIndex === -1) return svgContent

    return (
      svgContent.slice(0, closingIndex) +
      styleBlock +
      svgContent.slice(closingIndex)
    )
  } catch (error) {
    console.error("Error highlighting SVG parts:", error)
    return svgContent // Return original if highlighting fails
  }
}

export async function generateBodyPartsImage(
  selectedParts: string[],
): Promise<string> {
  try {
    console.log(`Generating image with parts: ${selectedParts.join(', ')}`)

    // Canvas dimensions for HD image
    const canvasWidth = 1200
    const canvasHeight = 800
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext("2d")

    // Set background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Define positions for 4 views
    const viewPositions = [
      { x: 50, y: 100, width: 250, height: 400, view: "front", file: "front-view.svg" },
      { x: 350, y: 100, width: 250, height: 400, view: "back", file: "back-view.svg" },
      { x: 650, y: 100, width: 250, height: 400, view: "left", file: "left-view.svg" },
      { x: 950, y: 100, width: 250, height: 400, view: "right", file: "right-view.svg" },
    ]

    let publicPath: string
    try {
      publicPath = findPublicPath()
    } catch (error) {
      console.error("Could not find public path:", error)
      return generatePlaceholderImage(selectedParts, "Public directory not found")
    }

    // Process each view
    for (const position of viewPositions) {
      try {
        const svgPath = path.join(publicPath, position.file)

        console.log(`Processing ${position.view}: ${svgPath}`)

        if (fs.existsSync(svgPath)) {
          // Read SVG content
          const svgContent = fs.readFileSync(svgPath, 'utf8')
          console.log(`SVG content length: ${svgContent.length}`)

          // Highlight selected parts
          const highlightedSvg = highlightSvgParts(svgContent, selectedParts)

          // Convert highlighted SVG to PNG
          const pngBuffer = await svgToPng(highlightedSvg, position.width, position.height)

          // Create image from buffer
          const image = await loadImage(pngBuffer)
          ctx.drawImage(image, position.x, position.y, position.width, position.height)

          // Add view label
          ctx.fillStyle = "#000000"
          ctx.font = "16px Arial"
          ctx.textAlign = "center"
          ctx.fillText(position.view.toUpperCase(), position.x + position.width / 2, position.y - 10)

          console.log(`Successfully processed ${position.view}`)

        } else {
          console.log(`SVG file not found: ${svgPath}`)

          // Draw placeholder if SVG doesn't exist
          ctx.strokeStyle = "#cccccc"
          ctx.lineWidth = 2
          ctx.strokeRect(position.x, position.y, position.width, position.height)

          ctx.fillStyle = "#666666"
          ctx.font = "16px Arial"
          ctx.textAlign = "center"
          ctx.fillText(position.view.toUpperCase(), position.x + position.width / 2, position.y + position.height / 2 - 10)
          ctx.fillText("(SVG not found)", position.x + position.width / 2, position.y + position.height / 2 + 10)
        }
      } catch (error) {
        console.error(`Error processing ${position.view}:`, error)

        // Draw error placeholder
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 2
        ctx.strokeRect(position.x, position.y, position.width, position.height)

        ctx.fillStyle = "#ff0000"
        ctx.font = "14px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Error loading", position.x + position.width / 2, position.y + position.height / 2 - 10)
        ctx.fillText(position.view, position.x + position.width / 2, position.y + position.height / 2 + 10)
      }
    }

    // Add title
    ctx.fillStyle = "#000000"
    ctx.font = "bold 28px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Selected Body Parts", canvasWidth / 2, 40)

    // Add selected parts list
    if (selectedParts.length > 0) {
      ctx.font = "18px Arial"
      ctx.textAlign = "left"
      ctx.fillText("Selected Parts:", 50, canvasHeight - 120)

      const partsList = selectedParts
        .map((part) => part.replace(/-/g, " "))
        .join(", ")

      // Wrap text if too long
      const maxWidth = canvasWidth - 100
      const words = partsList.split(" ")
      let line = ""
      let y = canvasHeight - 90

      for (const word of words) {
        const testLine = line + word + " "
        const metrics = ctx.measureText(testLine)

        if (metrics.width > maxWidth && line !== "") {
          ctx.fillText(line, 50, y)
          line = word + " "
          y += 25
        } else {
          line = testLine
        }
      }
      if (line.trim()) {
        ctx.fillText(line, 50, y)
      }
    }

    // Convert canvas to base64
    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error generating body parts image:", error)
    return generatePlaceholderImage(selectedParts, `Error: ${error.message}`)
  }
}

function generatePlaceholderImage(selectedParts: string[], errorMessage?: string): string {
  try {
    const canvas = createCanvas(800, 600)
    const ctx = canvas.getContext("2d")

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 800, 600)

    // Black text
    ctx.fillStyle = "#000000"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Selected Body Parts", 400, 50)

    if (errorMessage) {
      ctx.fillStyle = "#ff0000"
      ctx.font = "16px Arial"
      ctx.fillText(errorMessage, 400, 80)
    }

    // List selected parts
    ctx.fillStyle = "#000000"
    ctx.font = "18px Arial"
    ctx.textAlign = "left"
    let y = 120

    selectedParts.forEach((part, index) => {
      const displayName = part.replace(/-/g, " ")
      ctx.fillText(`• ${displayName}`, 50, y + index * 30)
    })

    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error generating placeholder image:", error)
    return ""
  }
}