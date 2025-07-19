import { Button, CircularProgress } from "@mui/material";
import Dropzone from "react-dropzone";


export default function FileUpload(props) {

  const isLoading = props.isLoading

  const onDrop = (image) => {


    if(props.allowedType){
      if(!props.allowedType.includes(image[0].type)){
        alert("Harap Unggah File dengan Tipe  : " + props.allowedType)
        return
      }
    }

    props.onDrop(image)

  }

  return (
    <>

      <Dropzone
        noDrag={true}
        onDrop={onDrop}>
        {({getRootProps, getInputProps}) => (
          <div
            style={{
              display : "flex",
              flexDirection : "row",
              alignItems : "center",
            }}
            {...getRootProps()}>

            <Button
              style={{
                ...props.buttonStyle
              }}
              disabled={isLoading}
              color={"primary"}
              variant={"outline"}>
              <input {...getInputProps()}
              />
              {props.text ? props.text : "+ Upload File"}
            </Button>

            {
              props.hideSpinner ?
                null
                :
                <CircularProgress
                  size={"sm"}
                  style={{
                    marginLeft : " 0.5em", display: isLoading ? "inline" : "none"
                  }}
                  animation="border"/>
            }


          </div>
        )}
      </Dropzone>

    </>

  )
}
