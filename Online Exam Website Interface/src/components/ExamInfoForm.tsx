import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import type { IExam } from "@/types";

interface CandidateInfo {
  name: string;
  email: string;
  phone: string;
}

interface ExamInfoFormProps {
  exam?: IExam;
  candidate?: CandidateInfo;
  onStartExam: () => void;
  onCancel?: () => void;
  showBackButton?: boolean;
  mode?: string;
  disabled?: boolean;
}

export const ExamInfoForm: React.FC<ExamInfoFormProps> = ({
  exam,
  candidate,
  onStartExam,
  onCancel,
  showBackButton,
  mode,
  disabled,
}) => {
  const [isAgreed, setIsAgreed] = React.useState(false);

  // Default values for optional props
  const defaultExam: IExam = {
    id: 0,
    title: "Bài thi mẫu",
    description: "Mô tả bài thi",
    image: "/images/background.png",
    duration: "90 phút",
    questions: 50,
    passingScore: 70,
    category: "Chưa xác định",
    price: 0,
    rating: 4.5,
    students: 0,
    difficulty: "Beginner",
  };

  const defaultCandidate: CandidateInfo = {
    name: "Chưa có thông tin",
    email: "Chưa có thông tin",
    phone: "Chưa có thông tin"
  };

  const examInfo = exam || defaultExam;
  const candidateInfo = candidate || defaultCandidate;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f9fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: 900,
          width: "100%",
          p: 4,
          borderRadius: 3,
          boxShadow: 3,
          backgroundColor: "#fff",
        }}
      >
        <CardContent>
          {/* --- TIÊU ĐỀ --- */}
          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
            textAlign="center"
            mb={1}
          >
            {examInfo.title}
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            mb={3}
          >
            {examInfo.description}
          </Typography>

          {/* --- DÒNG NỔI BẬT --- */}
          <Box
            sx={{
              bgcolor: "#e3f2fd",
              border: "1px solid #bbdefb",
              borderRadius: 2,
              p: 2,
              mb: 3,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              color="primary"
              fontWeight="bold"
              sx={{ letterSpacing: 0.5 }}
            >
              Thời gian làm bài: {examInfo.duration} | Tổng số câu:{" "}
            {examInfo.questions} | Điểm đạt: {(() => {
              // Calculate passingMark from passingScore percentage
              const passingMark = (examInfo as any).passingMark || 
                (examInfo.passingScore && examInfo.questions 
                  ? Math.ceil((examInfo.passingScore / 100) * examInfo.questions) 
                  : examInfo.passingScore || 0);
              return `${passingMark} điểm`;
            })()}
          </Typography>
          </Box>

          {/* --- THÔNG TIN THÍ SINH --- */}
          <Typography 
            variant="h6" 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mb: 2 }}
          >
            Thông tin thí sinh
          </Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={4}>
              <Typography 
                variant="body1"
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  mb: 1
                }}
              >
                <b>Họ tên:</b> {candidateInfo.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography 
                variant="body1"
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  mb: 1
                }}
              >
                <b>Email:</b> {candidateInfo.email}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography 
                variant="body1"
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  mb: 1
                }}
              >
                <b>Số điện thoại:</b> {candidateInfo.phone}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* --- THÔNG TIN BÀI THI --- */}
          <Typography 
            variant="h6" 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mb: 2 }}
          >
            Chi tiết bài thi
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="body1"
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  mb: 1.5
                }}
              >
                <b>Lĩnh vực:</b> {examInfo.category}
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  mb: 1.5
                }}
              >
                <b>Phí thi:</b> {new Intl.NumberFormat('vi-VN').format(examInfo.price)}đ
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="body1"
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  lineHeight: 1.6,
                  mb: 1.5
                }}
              >
                <b>Tổng cộng:</b> {new Intl.NumberFormat('vi-VN').format(examInfo.price)}đ
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.6,
                  mb: 1
                }}
              >
                Miễn phí thi lại nếu không đạt
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.6,
                  mb: 1
                }}
              >
                Có hiệu lực trong 30 ngày
              </Typography>
            </Grid>
          </Grid>

          {/* --- XÁC NHẬN --- */}
          <Box mt={4} display="flex" justifyContent="center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  sx={{ 
                    '& .MuiSvgIcon-root': { 
                      fontSize: { xs: '1.5rem', sm: '1.75rem' } 
                    }
                  }}
                />
              }
              label={
                <Typography 
                  variant="body1"
                  sx={{ 
                    fontSize: { xs: '0.95rem', sm: '1.1rem' },
                    lineHeight: 1.5,
                    fontWeight: 500,
                    textAlign: 'left'
                  }}
                >
                  Tôi xác nhận thông tin trên là chính xác và đồng ý bắt đầu bài thi.
                </Typography>
              }
              sx={{ 
                alignItems: 'center',
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  ml: 1,
                  mt: 0
                }
              }}
            />
          </Box>

          {/* --- NÚT BẮT ĐẦU VÀ HỦY --- */}
          <Box mt={2} textAlign="center" sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {showBackButton && onCancel && (
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={onCancel}
                sx={{ px: 4, py: 1.2, fontWeight: "bold" }}
              >
                Quay lại
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={!!disabled || !isAgreed}
              onClick={onStartExam}
              sx={{ px: 6, py: 1.2, fontWeight: "bold" }}
            >
              {mode === 'examstart' ? 'Bắt đầu làm bài' : 'Bắt đầu thi'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
