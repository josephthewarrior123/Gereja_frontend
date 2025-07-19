import { Card, CardContent, Typography } from "@mui/material";


export default function CustomDashboardStatsCard({label, value}) {

  return(
    <Card sx={{width: '100%', boxShadow: "none", border: "1px solid #E0E0E0", borderRadius: "8px"}}>
      <CardContent sx={{ display: 'flex', flexDirection: "column", gap: 6}}>
        <Typography sx={{fontSize: 16, fontWeight: 400}}>{label}</Typography>
        <Typography sx={{fontSize: 20, fontWeight: 700}}>{value}</Typography>
      </CardContent>
    </Card>
  )
}