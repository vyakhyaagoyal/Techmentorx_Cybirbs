# Quick Start Guide - Student Engagement Monitoring System

## 🚀 Quick Start (5 Steps)

### Step 1: Install Dependencies
```bash
cd d:\cybirbs\Techmentorx_Cybirbs\student_engagement_monitor
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Download DAiSEE Dataset
```bash
python scripts/download_dataset.py
```
**Note**: You'll need a Kaggle account and API token. Follow the prompts in the script.

### Step 3: Extract Features and Train Model
```bash
# Extract features from training data (this will take time!)
python scripts/preprocess_all.py --splits Train --max-videos 100

# Train the model
python src/models/train_model.py --load-features

# Evaluate on test set
python scripts/preprocess_all.py --splits Test --max-videos 50
python src/models/evaluate_model.py
```

### Step 4: Test with Sample Video
```bash
# Process a classroom video
python scripts/run_inference.py --input path/to/classroom_video.mp4 --display
```

### Step 5: View Dashboard
```bash
streamlit run src/dashboard/dashboard_app.py
```

---

## 📖 Detailed Workflow

### For Development/Testing (Small Dataset)
```bash
# 1. Download dataset
python scripts/download_dataset.py

# 2. Process small subset for testing
python scripts/preprocess_all.py --splits Train --max-videos 50

# 3. Train model
python src/models/train_model.py --load-features

# 4. Test inference
python scripts/run_inference.py --input 0  # Webcam test
```

### For Production (Full Dataset)
```bash
# 1. Download dataset
python scripts/download_dataset.py

# 2. Process all splits (WARNING: This takes hours!)
python scripts/preprocess_all.py

# 3. Train model
python src/models/train_model.py --load-features

# 4. Evaluate
python scripts/preprocess_all.py --splits Test
python src/models/evaluate_model.py

# 5. Deploy for classroom use
python scripts/run_inference.py --input rtsp://camera_ip/stream
```

---

## 🎯 Common Use Cases

### 1. Process Recorded Classroom Video
```bash
python scripts/run_inference.py \
    --input classroom_recording.mp4 \
    --output-video output_with_analysis.mp4 \
    --output-report report.json \
    --display
```

### 2. Live Classroom Monitoring
```bash
python scripts/run_inference.py \
    --input rtsp://192.168.1.100:554/stream \
    --mode realtime \
    --skip-frames 5 \
    --display
```

### 3. Batch Process Multiple Videos
```bash
for video in classroom_videos/*.mp4; do
    python scripts/run_inference.py --input "$video" --output-report "reports/$(basename $video .mp4).json"
done
```

---

## 🔧 Troubleshooting

### Issue: CUDA/GPU not detected
**Solution**: Install CUDA-enabled PyTorch
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Issue: Out of memory
**Solution**: Reduce batch size or skip more frames
```bash
# Edit configs/config.yaml
video:
  skip_frames: 5  # Process every 5th frame instead of 3
```

### Issue: Low FPS in real-time mode
**Solution**: Use smaller YOLO model
```bash
# The system uses yolov8n.pt by default (fastest)
# If still slow, increase skip_frames in config
```

### Issue: No faces detected
**Solution**: Check lighting and camera angle
- Ensure good lighting in classroom
- Camera should face students directly
- Adjust MediaPipe confidence thresholds in code if needed

---

## 📊 Understanding the Output

### Engagement Score (0-1 scale)
- **0.7-1.0**: Highly engaged (green)
- **0.4-0.7**: Moderately engaged (yellow)
- **0.0-0.4**: Disengaged (red)

### Affective States (0-3 scale)
- **Boredom**: 0 = Not bored, 3 = Very bored
- **Engagement**: 0 = Not engaged, 3 = Highly engaged
- **Confusion**: 0 = Not confused, 3 = Very confused
- **Frustration**: 0 = Not frustrated, 3 = Very frustrated

---

## 🎓 Next Steps

1. **Fine-tune the model** on your own classroom data
2. **Adjust thresholds** in `configs/config.yaml` for your environment
3. **Integrate with LMS** (Learning Management System)
4. **Set up automated alerts** for instructors
5. **Deploy on edge device** for real-time classroom monitoring

---

## 📞 Need Help?

Check the full README.md for detailed documentation.
