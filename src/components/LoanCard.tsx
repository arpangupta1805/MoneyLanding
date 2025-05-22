import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  AttachMoney,
  Payment,
  CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Loan, LoanStatus } from '../types/index';

interface LoanCardProps {
  loan: Loan;
  isLent?: boolean;
}

const LoanCard = ({ loan, isLent = true }: LoanCardProps) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.ACTIVE:
        return theme.palette.info.main;
      case LoanStatus.PARTIALLY_PAID:
        return theme.palette.warning.main;
      case LoanStatus.COMPLETED:
        return theme.palette.success.main;
      case LoanStatus.OVERDUE:
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  const repaidPercentage = Math.min(
    100,
    Math.max(
      0,
      ((loan.initialAmount - loan.currentAmount) / loan.initialAmount) * 100
    )
  );

  const handleClick = () => {
    navigate(`/loan/${loan.id}`);
  };

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={handleClick}
    >
      <Chip
        label={loan.status}
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          right: 10,
          bgcolor: getStatusColor(loan.status),
          color: '#fff',
          fontWeight: 'bold',
        }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
            {isLent ? `To: ${loan.borrowerName}` : `From: ${loan.borrowerName}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{loan.borrowerUsername}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mt: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoney color="primary" sx={{ mr: 1 }} />
            <Typography variant="body2">
              Amount: ₹{loan.initialAmount.toFixed(2)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Payment color="secondary" sx={{ mr: 1 }} />
            <Typography variant="body2">
              Interest Rate: {loan.interestRate}%
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarToday color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              Due: {format(new Date(loan.endDate), 'dd MMM yyyy')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Repayment progress</Typography>
            <Typography variant="body2">{repaidPercentage.toFixed(0)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={repaidPercentage}
            sx={{
              height: 8,
              borderRadius: 5,
              bgcolor: theme.palette.mode === 'light' ? '#e0e0e0' : '#424242',
              '& .MuiLinearProgress-bar': {
                bgcolor: repaidPercentage >= 100
                  ? theme.palette.success.main
                  : repaidPercentage > 0
                    ? theme.palette.warning.main
                    : theme.palette.primary.main,
              },
            }}
          />
        </Box>

        <Typography 
          variant="body1" 
          sx={{ 
            mt: 2, 
            fontWeight: 'bold',
            color: theme.palette.primary.main 
          }}
        >
          Remaining: ₹{loan.currentAmount.toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default LoanCard; 