"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Text, Billboard } from "@react-three/drei"
import * as THREE from "three"
import Image from 'next/image'
import { Vector3 } from 'three'
import { LineSegments, BufferGeometry, LineBasicMaterial } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const sections = [
  { title: "Workflow Automation", description: "Streamline processes with cutting-edge automation solutions", media: "/Law.mp4" },
  { title: "Forensic Investigation", description: "In-depth investigative services for uncovering critical insights", media: "/Accounting.jpg" },  
  { title: "Problem Solving", description: "Innovative solutions to complex challenges", media: "/ProblemSolving.jpg" },
  { title: "Management", description: "Effective leadership and organizational strategies", media: "/Management.mp4" },
  { title: "Web Development", description: "Cutting-edge web solutions for modern businesses", media: "/WebDevelopment.jpg" },
  { title: "Coding", description: "Custom software development and programming", media: "/Coding.mp4" },
]

interface NodeProps {
  position: Vector3
  color: string
  label: string
  onClick: () => void
  isCenter?: boolean
}

function Node({ position, color, label, onClick, isCenter = false }: NodeProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.01
      mesh.current.rotation.y += 0.01
    }
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
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, isCenter ? -0.3 : -0.2, 0]}
          fontSize={isCenter ? 0.1 : 0.08}
          color="#f8f8f2"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Billboard>
    </group>
  )
}

function NodeGraph({ sections, onNodeClick }: { sections: Array<{ title: string }>, onNodeClick: (index: number) => void }) {
  const { camera } = useThree();
  const linesRef = useRef<LineSegments<BufferGeometry, LineBasicMaterial>>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const pointRefs = useRef<THREE.Mesh[]>([]);  // Array of refs for multiple particles

  const travelSpeed = 0.5;  // Increased speed for quicker particle movement

  useEffect(() => {
    camera.position.z = 5; // Set the initial camera position
  }, [camera]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.minDistance = 1; // Allow zooming in closer
      controlsRef.current.maxDistance = 20; // Allow zooming out further
    }
  }, []);

  const nodePositions = useMemo(() => {
    const centerPosition = new THREE.Vector3(0, 0, 0);
    const otherPositions = sections.map(() => {
      return new THREE.Vector3(
        (Math.random() - 0.5) * 4,  // x between -2 and 2
        (Math.random() - 0.5) * 4,  // y between -2 and 2
        (Math.random() - 0.5) * 2   // z between -1 and 1
      );
    });
    return [centerPosition, ...otherPositions];
  }, [sections]);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime(); // Get the elapsed time since the component was mounted

    const radius = 3; // Set the radius of the circular path

    // Rotate the camera around the center of the graph (anti-clockwise)
    camera.position.x = radius * Math.cos(elapsedTime * 0.1);  // Slow rotation
    camera.position.y = radius * Math.sin(elapsedTime * 0.1);
    camera.lookAt(0, 0, 0);  // Ensure camera is always looking at the center

    // Animate particles for each node (except the center node)
    nodePositions.slice(1).forEach((targetPosition, i) => {
      const startPosition = nodePositions[0];  // Always from the center node
      const lerpFactor = (Math.sin(elapsedTime * travelSpeed + i * Math.PI / sections.length) + 1) / 2;  // Vary the phase for each particle

      if (pointRefs.current[i]) {
        pointRefs.current[i].position.lerpVectors(startPosition, targetPosition, lerpFactor);  // Interpolate position for each particle
      }
    });
  });

  useFrame(() => {
    if (linesRef.current) {
      const positions = [];

      // Connect center to all other nodes
      for (let i = 1; i < nodePositions.length; i++) {
        positions.push(nodePositions[0].x, nodePositions[0].y, nodePositions[0].z);
        positions.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
      }

      linesRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Node 
        position={nodePositions[0]} 
        color="#bd93f9" 
        label="LTB Ventures" 
        isCenter={true} 
        onClick={() => {}}
      />
      {sections.map((section, i) => (
        <Node
          key={section.title}
          position={nodePositions[i + 1]}
          color="#50fa7b"
          label={section.title}
          onClick={() => onNodeClick(i)}
        />
      ))}

      {/* Small traveling points for each edge */}
      {sections.map((section, i) => (
        <mesh
          ref={(el: THREE.Mesh | null) => {
            pointRefs.current[i] = el as THREE.Mesh;
          }}
          key={section.title}
          position={nodePositions[0]}
        >
          <sphereGeometry args={[0.03, 32, 32]} />  {/* Smaller sphere size */}
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />  {/* Changed to white */}
        </mesh>
      ))}


      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#6272a4" linewidth={1} />
      </lineSegments>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}  // Disable panning
        enableZoom={true}  // Allow zooming
        zoomSpeed={0.5}    // Set the zoom speed
        rotateSpeed={1.0}  // Adjust rotation speed if needed
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,   // Left-click to rotate
          MIDDLE: THREE.MOUSE.DOLLY,  // Middle mouse button to zoom
          RIGHT: THREE.MOUSE.PAN,     // Right-click to pan
        }}
        // Make sure damping is enabled for smoother experience
        enableDamping={true}
        dampingFactor={0.1}  // Adjust for smoother motion
      />
    </>
  );
}


export function LtbVentureHomeDark() {
  const [activeSection, setActiveSection] = useState(0)
  const [clickedSection, setClickedSection] = useState<number | null>(null)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const threeJsSectionRef = useRef<HTMLElement | null>(null)

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

  const scrollToSection = (index: number) => {
    if (sectionRefs.current[index]) {
      setClickedSection(index + 1)
      sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" })
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
          <Image
            src="/logo.png"  // Update this path to the correct location of your logo file
            alt="LTB Venture Logo"
            width={200}  // Adjust the width as needed
            height={100}  // Adjust the height as needed
            className="mx-auto mb-6"  // This centers the image and adds some margin below
          />
          <h1 className="text-5xl font-bold mb-4">LTB Ventures</h1>
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
        <div className="w-full h-[calc(100vh-8rem)] relative">
          {/* Background indicator for interactive area */}
          <div className="absolute inset-0 bg-gray-800 bg-opacity-50 rounded-lg border-2 border-purple-500 border-opacity-50"></div>
          
          {/* Instruction text */}
          <div className="absolute top-4 left-4 text-purple-300 text-sm">
          </div>
          
          {/* Three.js Canvas */}
          <Canvas className="absolute inset-0">
            <NodeGraph sections={sections} onNodeClick={scrollToSection} />
          </Canvas>
        </div>
      </section>

      {/* Specialization Sections */}
      {sections.map((section, index) => (
      <motion.section
        key={section.title}
        ref={(el: HTMLElement | null) => { sectionRefs.current[index] = el }}
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
