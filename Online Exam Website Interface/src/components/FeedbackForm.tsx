import React, { useState } from 'react';
import { chatService } from '@/services/chat.service';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface FeedbackFormProps {
  examId?: string | number;
  onSuccess?: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ examId, onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi feedback');
      return;
    }

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      await chatService.submitFeedback(rating, comment.trim() || undefined, examId);
      toast.success('Cảm ơn bạn đã đánh giá!');
      setRating(0);
      setComment('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể gửi feedback';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
      <h5 className="mb-3" style={{ color: '#1a4b8c' }}>Đánh giá của bạn</h5>
      
      <form onSubmit={handleSubmit}>
        {/* Rating Stars */}
        <div className="mb-3">
          <label className="form-label fw-medium">Số sao đánh giá *</label>
          <div className="d-flex align-items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="btn btn-link p-0 border-0"
                style={{ 
                  fontSize: '2rem',
                  lineHeight: '1',
                  color: star <= (hoveredRating || rating) ? '#ffc107' : '#dee2e6',
                  transition: 'color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                disabled={submitting}
              >
                ★
              </button>
            ))}
            {rating > 0 && (
              <span className="ms-2 text-muted small">
                {rating === 1 && 'Rất không hài lòng'}
                {rating === 2 && 'Không hài lòng'}
                {rating === 3 && 'Bình thường'}
                {rating === 4 && 'Hài lòng'}
                {rating === 5 && 'Rất hài lòng'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-3">
          <label htmlFor="feedback-comment" className="form-label fw-medium">
            Nhận xét của bạn
          </label>
          <textarea
            id="feedback-comment"
            className="form-control"
            rows={4}
            placeholder="Chia sẻ ý kiến của bạn về bài thi này..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
            maxLength={1000}
            style={{ resize: 'vertical' }}
          />
          <div className="form-text text-end">
            {comment.length}/1000 ký tự
          </div>
        </div>

        {/* Submit Button */}
        <div className="d-flex justify-content-end">
          <button
            type="submit"
            className="btn"
            style={{
              backgroundColor: '#1a4b8c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 24px',
              fontWeight: '500'
            }}
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang gửi...
              </>
            ) : (
              'Gửi đánh giá'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

