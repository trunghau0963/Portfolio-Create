// "use client"

// import { motion, AnimatePresence } from "framer-motion"
// import { usePathname } from "next/navigation"
// import { useState, useEffect, type ReactNode } from "react"

// interface PageTransitionProps {
//   children: ReactNode
// }

// export function PageTransition({ children }: PageTransitionProps) {
//   const pathname = usePathname()
//   const [renderKey, setRenderKey] = useState(pathname)

//   // Update the key when the pathname changes
//   useEffect(() => {
//     // Short delay to ensure smooth transitions
//     const timer = setTimeout(() => {
//       setRenderKey(pathname)
//     }, 50)

//     return () => clearTimeout(timer)
//   }, [pathname])

//   return (
//     <AnimatePresence mode="wait">
//       <motion.div
//         key={renderKey}
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -10 }}
//         transition={{ duration: 0.3, ease: "easeInOut" }}
//         className="w-full"
//       >
//         {children}
//       </motion.div>
//     </AnimatePresence>
//   )
// }
