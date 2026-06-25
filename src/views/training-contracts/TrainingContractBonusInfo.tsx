import { useMemo } from 'react'
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

const InfoCard = ({ title, value }: { title: string; value: any }) => (
  <Card>
    <CardContent>
      <Typography fontWeight={700} sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Typography>{value}</Typography>
    </CardContent>
  </Card>
)

const TrainingContractBonusInfo = ({ totalAmount }: { totalAmount: number }) => {
  const { trainingContract, totalCalculatedHours } = useSelector((s: RootState) => {
    const state = (s as any).trainingContract ?? {}

    return {
      trainingContract: state?.selectedTrainingContract ?? state?.trainingContract ?? state,
      totalCalculatedHours: Number(state?.totalCalculatedHours ?? 0)
    }
  }) as any

  const hasTrainingContract = Boolean(trainingContract?.id)
  const bonus1 = Number(trainingContract?.bonus_hours_first_year ?? 0)
  const bonus2 = Number(trainingContract?.bonus_hours_second_year ?? 0)

  const totalBonusHours = useMemo(() => bonus1 + bonus2, [bonus1, bonus2])

  return (
    <Grid container spacing={4} sx={{ mb: 6, justifyContent: 'center' }}>
      <Grid item xs={12} sm={6} md={4}>
        <InfoCard title='Bonificadas 1º Año' value={hasTrainingContract ? bonus1 : ''} />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <InfoCard title='Bonificadas 2º Año' value={hasTrainingContract ? bonus2 : ''} />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <InfoCard title='Bonificadas Totales' value={hasTrainingContract ? totalBonusHours : ''} />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <InfoCard title='Total Introducida' value={`${Number(totalAmount ?? 0)} €`} />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <InfoCard title='Total' value={`${totalCalculatedHours} horas`} />
      </Grid>
    </Grid>
  )
}

export default TrainingContractBonusInfo
