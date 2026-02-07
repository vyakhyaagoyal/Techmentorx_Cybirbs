"""
Standalone inference script
Process CCTV footage and generate engagement reports
"""

import cv2
import sys
from pathlib import Path
import argparse
import json
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent / 'src'))

from cctv_pipeline.engagement_processor import EngagementProcessor


def main():
    parser = argparse.ArgumentParser(description='Run engagement analysis on CCTV footage')
    parser.add_argument('--input', type=str, required=True,
                       help='Input video file or RTSP stream URL or webcam index')
    parser.add_argument('--config', type=str, default='configs/config.yaml',
                       help='Path to configuration file')
    parser.add_argument('--model-dir', type=str, default='models/trained',
                       help='Directory containing trained models')
    parser.add_argument('--mode', type=str, default='batch',
                       choices=['realtime', 'batch'],
                       help='Processing mode')
    parser.add_argument('--skip-frames', type=int, default=3,
                       help='Process every Nth frame (for performance)')
    parser.add_argument('--output-video', type=str, default=None,
                       help='Path to save output video with visualizations')
    parser.add_argument('--output-report', type=str, default=None,
                       help='Path to save JSON report')
    parser.add_argument('--display', action='store_true',
                       help='Display video while processing')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("Student Engagement Monitoring System - Inference")
    print("=" * 70)
    
    # Initialize processor
    processor = EngagementProcessor(args.config, args.model_dir)
    
    # Determine input type
    if args.input.isdigit():
        input_source = int(args.input)
        is_stream = True
    elif args.input.startswith('rtsp://'):
        input_source = args.input
        is_stream = True
    else:
        input_source = args.input
        is_stream = False
    
    # Open video
    cap = cv2.VideoCapture(input_source)
    
    if not cap.isOpened():
        print(f"❌ Error: Could not open video source: {args.input}")
        return
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"\nVideo Info:")
    print(f"  Resolution: {width}x{height}")
    print(f"  FPS: {fps}")
    if not is_stream:
        print(f"  Total Frames: {total_frames}")
    print(f"  Mode: {args.mode}")
    print(f"  Skip Frames: {args.skip_frames}")
    
    # Setup output video writer if requested
    video_writer = None
    if args.output_video:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        video_writer = cv2.VideoWriter(args.output_video, fourcc, fps/args.skip_frames, (width, height))
        print(f"  Output Video: {args.output_video}")
    
    # Process video
    all_results = []
    frame_idx = 0
    
    print(f"\n{'='*70}")
    print("Processing...")
    print(f"{'='*70}")
    
    if not is_stream:
        from tqdm import tqdm
        pbar = tqdm(total=total_frames)
    
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Process frame at intervals
            if frame_idx % args.skip_frames == 0:
                results = processor.process_frame(frame)
                all_results.append(results)
                
                # Visualize
                vis_frame = processor.visualize_results(frame, results)
                
                # Save to output video
                if video_writer:
                    video_writer.write(vis_frame)
                
                # Display
                if args.display:
                    cv2.imshow('Engagement Analysis', vis_frame)
                    
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        print("\nStopped by user")
                        break
            
            frame_idx += 1
            
            if not is_stream:
                pbar.update(1)
    
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    
    finally:
        cap.release()
        if video_writer:
            video_writer.release()
        if args.display:
            cv2.destroyAllWindows()
        if not is_stream:
            pbar.close()
    
    # Generate report
    print(f"\n{'='*70}")
    print("Generating Report...")
    print(f"{'='*70}")
    
    if all_results:
        import numpy as np
        
        # Calculate summary statistics
        total_students_detected = max([r['total_students'] for r in all_results])
        avg_class_engagement = np.mean([r['class_engagement'] for r in all_results])
        avg_highly_engaged = np.mean([r['highly_engaged'] for r in all_results])
        avg_disengaged = np.mean([r['disengaged'] for r in all_results])
        
        # Engagement over time
        engagement_timeline = [
            {
                'frame': r['frame_number'],
                'engagement': r['class_engagement'],
                'students': r['total_students']
            }
            for r in all_results
        ]
        
        # Compile report
        report = {
            'metadata': {
                'input_source': args.input,
                'timestamp': datetime.now().isoformat(),
                'total_frames_processed': len(all_results),
                'processing_mode': args.mode
            },
            'summary': {
                'total_students_detected': int(total_students_detected),
                'average_class_engagement': float(avg_class_engagement),
                'average_highly_engaged': float(avg_highly_engaged),
                'average_disengaged': float(avg_disengaged)
            },
            'timeline': engagement_timeline
        }
        
        # Print summary
        print(f"\nSummary:")
        print(f"  Total Students Detected: {total_students_detected}")
        print(f"  Average Class Engagement: {avg_class_engagement:.3f}")
        print(f"  Average Highly Engaged: {avg_highly_engaged:.1f}")
        print(f"  Average Disengaged: {avg_disengaged:.1f}")
        
        # Save report
        if args.output_report:
            with open(args.output_report, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"\n  💾 Report saved to {args.output_report}")
        else:
            # Save to default location
            output_dir = Path('outputs/reports')
            output_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            report_file = output_dir / f'engagement_report_{timestamp}.json'
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"\n  💾 Report saved to {report_file}")
    
    print(f"\n{'='*70}")
    print("✅ Processing Complete!")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
