import {
    Box,
    Table,
    TableBody,
    TableContainer,
    TableFooter,
    TableHead,
    TablePagination,
    TableSortLabel,
    Toolbar
  } from '@mui/material';
  import TableCell from '@mui/material/TableCell';
  import TableRow from '@mui/material/TableRow';
  import 'leaflet/dist/leaflet.css';
  import _ from 'lodash';
  import { useState } from 'react';
  import SearchBar from '../SearchBar';
  // ----------------------------------------------------------------------
  
  export default function CustomTableFrontendFilter({ tableHead, tableRow, data, onPageChange, sorting = true, pagination = true, actionButton }) {
  
    const [searchKeyword, setSearchKeyword] = useState("")
  
    const [sortBy, setSortBy] = useState(null);
    const [sortDirection, setSortDirection] = useState(null);
  
    const [limit, setLimit] = useState(10)
    const [page, setPage] = useState(0)
  
    const onPageChangeTemp = (event, newPage) => {
      setPage(newPage)
    }
  
    const onLimitChangeTemp = (event) => {
      setLimit(event.target.value)
    }
  
    const handleRequestSort = (event) => {
      setSortBy(event);
      if(event === sortBy){
        if(sortDirection === "asc"){
          setSortDirection("desc")
        }else{
          setSortDirection("asc")
        }
      }else{
        setSortDirection("asc")
      }
  
    };
  
    // console.log("LIMITADO DD", data, searchKeyword)
  
  
    let filteredData = data.filter((obj) => {
      let isThereFilter = false
  
      for(let th of tableHead){
  
        if(th.filter){
          isThereFilter = true
          if(obj[th.id] && obj[th.id].includes && obj[th.id].toUpperCase) {
            if(obj[th.id]?.toUpperCase().includes(searchKeyword.toUpperCase())){
              return true
            }
          }
        }
      }
  
      if(!isThereFilter){
        return true
      }
  
    })
  
    let sortedData = filteredData
  
    if(sortBy && sortDirection){
      // sortedData = _.orderBy(sortedData, [sortBy], [sortDirection])
  
      sortedData.sort((a, b) =>
        sortDirection === "asc" ?
          _.get(a, sortBy) > _.get(b, sortBy) ? 1 : -1 :
          _.get(a, sortBy) > _.get(b, sortBy) ? -1 : 1
      )
    }
  
    let lowLimit = page * limit
    let highLimit = page * limit + limit 
  
    // console.log("LIMITADO SD", sortedData)
  
    let limitedData = sortedData.filter((obj,key)=>{
      //page, page per row
  
      // console.log("LIMITADO", key, lowLimit + " / " + highLimit, lowLimit < key && key < highLimit)
      if(lowLimit <= key && key < highLimit){
        return true
      }else{
        return false
      }
    })
    // console.log("LIMITADO", tableHead)
  
    return (
      <TableContainer sx={{ margin: 0 }}>
        <Toolbar sx={{ P: 10 }}>
          <SearchBar
            onEnter={(e) => {
              setSearchKeyword(e.target.value)
              setPage(0)
            }}
            initialValue={searchKeyword}
            placeholder={'Search...'}
  
          />
          <Box sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ mr: 2 }} />
          {
            actionButton
          }
        </Toolbar>
        <Table size="small" sx={{ borderRadius: 2, width: "100%" }}>

          <TableHead>
            <TableRow>
              {tableHead.map((headCell) => (
                <TableCell
                  width={headCell?.width}
                  key={headCell.id}
                  sortDirection={sorting && sortBy === headCell.id ? sortDirection : false}
                >
                  {headCell.label ? (
                    <TableSortLabel
                      active={sorting && sortBy === headCell.id}
                      direction={sortBy === headCell.id ? sortDirection : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {limitedData?.map((row,key) => (
              <TableRow key={key}>
                {tableRow(row, key)}
              </TableRow>
            ))}
          </TableBody>
          {pagination &&
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="td"
                  count={sortedData.length}
                  rowsPerPage={limit}
                  page={page}
                  onPageChange={onPageChangeTemp}
                  onRowsPerPageChange={onLimitChangeTemp}
                />
              </TableRow>
            </TableFooter>
          }
        </Table>
      </TableContainer>
    );
  }
  