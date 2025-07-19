

export default function CustomRow({children, className}){

  return(
    <div className={className+" "+"flex items-center justify-between"}>
      {children}
    </div>
  )
}