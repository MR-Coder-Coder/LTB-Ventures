"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { motion, useAnimation } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import * as THREE from "three"
import Image from 'next/image'

const sections = [
  { title: "Law", description: "Expert legal counsel for businesses", media: "/Law.mp4" },
  { title: "Accounting", description: "Precise financial management and reporting", media: "/Accounting.jpg" },
  { title: "Problem Solving", description: "Innovative solutions to complex challenges", media: "/ProblemSolving.jpg" },
  { title: "Management", description: "Effective leadership and organizational strategies", media: "/Management.mp4" },
  { title: "Web Development", description: "Cutting-edge web solutions for modern businesses", media: "/WebDevelopment.jpg" },
  { title: "Coding", description: "Custom software development and programming", media: "/Coding.mp4" },
]

function Node({ position, color, label, onClick, isCenter = false }) {
  const mesh = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y += 0.01
  })

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        scale={hovered ? 1.1 : 1}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[isCenter ? 0.2 : 0.15, 32, 32]} />
        <meshStandardMaterial color={hovered ? "#ff79c6" : color} />
      </mesh>
      <Text
        position={[0, isCenter ? -0.3 : -0.2, 0]}
        fontSize={isCenter ? 0.1 : 0.08}
        color="#f8f8f2"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

function NodeGraph({ onNodeClick }) {
  const { camera } = useThree()
  const linesRef = useRef()

  useEffect(() => {
    camera.position.z = 5
  }, [camera])

  const nodePositions = useMemo(() => {
    const centerPosition = new THREE.Vector3(0, 0, 0)
    const otherPositions = sections.map(() => {
      return new THREE.Vector3(
        (Math.random() - 0.5) * 4,  // x between -2 and 2
        (Math.random() - 0.5) * 4,  // y between -2 and 2
        (Math.random() - 0.5) * 2   // z between -1 and 1
      )
    })
    return [centerPosition, ...otherPositions]
  }, [])

  useFrame(() => {
    if (linesRef.current) {
      const positions = []
      
      // Connect center to all other nodes
      for (let i = 1; i < nodePositions.length; i++) {
        positions.push(nodePositions[0].x, nodePositions[0].y, nodePositions[0].z)
        positions.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z)
      }

      linesRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      linesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Node position={nodePositions[0]} color="#bd93f9" label="LTB Ventures" isCenter={true} />
      {sections.map((section, i) => (
        <Node
          key={section.title}
          position={nodePositions[i + 1]}
          color="#50fa7b"
          label={section.title}
          onClick={() => onNodeClick(i)}
        />
      ))}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#6272a4" linewidth={1} />
      </lineSegments>
      <OrbitControls enablePan={false} enableZoom={false} />
    </>
  )
}

export function LtbVentureHomeDark() {
  const [activeSection, setActiveSection] = useState(0)
  const [clickedSection, setClickedSection] = useState(null)
  const sectionRefs = useRef([])
  const threeJsSectionRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const newActiveSection = Math.floor(scrollPosition / windowHeight)
      setActiveSection(newActiveSection)
      setClickedSection(null) // Reset clickedSection when scrolling
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (index) => {
    if (sectionRefs.current[index]) {
      setClickedSection(index + 1) // Set clickedSection when a node is clicked
      sectionRefs.current[index].scrollIntoView({ behavior: "smooth" })
    }
  }

  const scrollToThreeJs = () => {
    if (threeJsSectionRef.current) {
      threeJsSectionRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100">
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">LTB Venture</h1>
          <p className="text-xl mb-8">Innovative Management Consultancy</p>
          <button 
            className="bg-purple-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-600 transition duration-300"
            onClick={scrollToThreeJs}
          >
            Home
          </button>
        </div>
      </section>

      {/* Interactive Node Edge Graph */}
      <section ref={threeJsSectionRef} className="h-screen bg-gray-900 p-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-purple-300">Our Expertise Network</h2>
        <div className="w-full h-[calc(100vh-8rem)]">
          <Canvas>
            <NodeGraph onNodeClick={scrollToSection} />
          </Canvas>
        </div>
      </section>

      {/* Specialization Sections */}
      {sections.map((section, index) => (
      <motion.section
        key={section.title}
        ref={(el) => (sectionRefs.current[index] = el)}
        className="min-h-screen flex items-center justify-center p-8 bg-gray-800"
        initial={{ opacity: 0 }}
        animate={
          (activeSection >= index + 1 && clickedSection === null) || 
          clickedSection === index + 1 
            ? { opacity: 1 } 
            : { opacity: 0 }
        }
        transition={{
          duration: 0.5,
        }}
        style={{
          pointerEvents: 
            (activeSection >= index + 1 && clickedSection === null) || 
            clickedSection === index + 1 
              ? 'auto' 
              : 'none',
        }}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-3xl font-bold mb-4 text-purple-300">{section.title}</h2>
            <p className="text-lg mb-4 text-gray-300">{section.description}</p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <CheckCircle className="text-green-400 mr-2" />
                <span>Expert consultancy</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-400 mr-2" />
                <span>Tailored solutions</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="text-green-400 mr-2" />
                <span>Proven track record</span>
              </li>
            </ul>
            <button 
              className="mt-6 bg-purple-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-600 transition duration-300 flex items-center"
              onClick={scrollToThreeJs}
            >
              Home <ArrowRight className="ml-2" />
            </button>
          </div>
          <div className="md:w-1/2">
            {section.media.endsWith('.mp4') ? (
              <video 
                className="w-full h-64 rounded-lg object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src={section.media} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={section.media}
                alt={`${section.title} illustration`}
                width={500}
                height={300}
                className="w-full h-64 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </motion.section>
    ))}
    </div>
  )
}
