

export default function CustomColumn({children, className}){

  return(
    <div className={className+" "+"flex flex-col"}>
      {children}
    </div>
  )
}