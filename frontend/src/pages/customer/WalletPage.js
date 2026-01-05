import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  CardGiftcard as GiftCardIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

export const WalletPage = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState('');

  // Get user's company subscriptions
  const { data: companiesData } = useApiQuery(
    ['my-companies'],
    API_ENDPOINTS.COMPANIES.MY_COMPANIES
  );

  // API returns { companies: [...] }
  const companies = Array.isArray(companiesData?.data) 
    ? companiesData.data 
    : (companiesData?.data?.companies || []);
  const companyIds = companies.map(c => c.company_id || c.id);

  // Fetch wallet balance and ledger
  const { data: walletData, isLoading: walletLoading } = useApiQuery(
    ['wallet', 'balance'],
    API_ENDPOINTS.WALLET.BALANCE,
    { enabled: companies.length > 0 }
  );

  const { data: ledgerData, isLoading: ledgerLoading } = useApiQuery(
    ['wallet', 'ledger'],
    API_ENDPOINTS.WALLET.LEDGER,
    { enabled: companies.length > 0 }
  );

  // Fetch gift cards
  const { data: giftCardsData, isLoading: giftCardsLoading } = useApiQuery(
    ['gift-cards', 'my-cards', companyIds[0]],
    companyIds.length > 0 ? API_ENDPOINTS.GIFT_CARDS.MY_CARDS(companyIds[0]) : null,
    { enabled: companyIds.length > 0 }
  );

  const redeemMutation = useMutation({
    mutationFn: async ({ companyId, code }) => {
      const response = await apiClient.post(API_ENDPOINTS.GIFT_CARDS.REDEEM(companyId), { code });
      return response.data;
    },
    onSuccess: () => {
      showToast('Gift card redeemed successfully', 'success');
      setGiftCardCode('');
    },
  });

  const balance = walletData?.data?.balance || 0;
  const ledger = ledgerData?.data || [];
  const giftCards = giftCardsData?.data || [];

  const handleRedeem = (companyId) => {
    if (!giftCardCode) {
      showToast('Please enter a gift card code', 'error');
      return;
    }
    redeemMutation.mutate({ companyId, code: giftCardCode });
  };

  if (walletLoading || ledgerLoading || giftCardsLoading) {
    return (
      <CustomerLayout>
        <Loading />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Wallet
        </Typography>

        {/* Balance Card */}
        <Card sx={{ mt: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Typography variant="body2" color="white" gutterBottom>
              Current Balance
            </Typography>
            <Typography variant="h3" color="white">
              {formatCurrency(balance)}
            </Typography>
          </CardContent>
        </Card>

        <Paper>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Transaction History" />
            <Tab label={`Gift Cards (${giftCards.length})`} />
          </Tabs>

          <TabPanel value={tab} index={0}>
            {ledger.length > 0 ? (
              <List>
                {ledger.map((transaction, idx) => (
                  <React.Fragment key={transaction.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">
                              {transaction.description || transaction.transaction_type}
                            </Typography>
                            <Typography
                              variant="h6"
                              color={transaction.transaction_type === 'credit' ? 'success.main' : 'error.main'}
                            >
                              {transaction.transaction_type === 'credit' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(transaction.created_at)}
                            </Typography>
                            <Box mt={0.5}>
                              <Chip
                                label={transaction.transaction_type}
                                size="small"
                                color={transaction.transaction_type === 'credit' ? 'success' : 'default'}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {idx < ledger.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <WalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">No transactions yet</Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {/* Redeem Gift Card */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Redeem Gift Card
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Gift Card Code"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value)}
                  placeholder="Enter gift card code"
                />
                <Button
                  variant="contained"
                  onClick={() => handleRedeem(companies[0]?.company_id)}
                  disabled={!giftCardCode || redeemMutation.isLoading}
                >
                  Redeem
                </Button>
              </Box>
            </Paper>

            {/* Gift Cards List */}
            {giftCards.length > 0 ? (
              <Grid container spacing={2}>
                {giftCards.map((giftCard) => (
                  <Grid item xs={12} sm={6} md={4} key={giftCard.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <GiftCardIcon color="primary" />
                          <Chip
                            label={giftCard.status}
                            size="small"
                            color={giftCard.status === 'active' ? 'success' : 'default'}
                          />
                        </Box>
                        <Typography variant="h6" gutterBottom>
                          {giftCard.code}
                        </Typography>
                        <Typography variant="h5" color="primary" gutterBottom>
                          {formatCurrency(giftCard.current_balance)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Initial: {formatCurrency(giftCard.initial_amount)}
                        </Typography>
                        {giftCard.expires_at && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Expires: {new Date(giftCard.expires_at).toLocaleDateString()}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <GiftCardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">No gift cards</Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Container>
    </CustomerLayout>
  );
};

