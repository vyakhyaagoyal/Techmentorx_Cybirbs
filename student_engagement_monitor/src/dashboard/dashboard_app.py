"""
Streamlit Dashboard for Student Engagement Monitoring
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path
import json
import sys
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent))

# Page config
st.set_page_config(
    page_title="Student Engagement Monitor",
    page_icon="📚",
    layout="wide"
)

# Title
st.title("📚 Student Engagement Monitoring System")
st.markdown("---")

# Sidebar
st.sidebar.header("Settings")

# Mode selection
mode = st.sidebar.radio("Mode", ["Live Monitoring", "Report Analysis"])

if mode == "Live Monitoring":
    st.header("🎥 Live Classroom Monitoring")
    
    st.info("⚠️ Live monitoring requires a running inference process. Use the command line tool to start processing.")
    
    st.code("""
# Start live monitoring:
python scripts/run_inference.py --input 0 --display
    
# Or process RTSP stream:
python scripts/run_inference.py --input rtsp://camera_ip:port/stream --display
    """)
    
    st.markdown("### Quick Start Guide")
    st.markdown("""
    1. **Connect Camera**: Ensure your CCTV camera or webcam is connected
    2. **Run Inference**: Use the command above to start processing
    3. **View Results**: Engagement metrics will be displayed in real-time
    4. **Generate Reports**: Reports are automatically saved to `outputs/reports/`
    """)

else:  # Report Analysis
    st.header("📊 Engagement Report Analysis")
    
    # File upload
    uploaded_file = st.file_uploader("Upload Engagement Report (JSON)", type=['json'])
    
    # Or select from existing reports
    reports_dir = Path('outputs/reports')
    if reports_dir.exists():
        report_files = list(reports_dir.glob('*.json'))
        if report_files:
            st.markdown("### Or select an existing report:")
            selected_report = st.selectbox(
                "Available Reports",
                options=[None] + report_files,
                format_func=lambda x: x.name if x else "-- Select --"
            )
        else:
            selected_report = None
            st.warning("No reports found in outputs/reports/")
    else:
        selected_report = None
    
    # Load report
    report_data = None
    
    if uploaded_file:
        report_data = json.load(uploaded_file)
    elif selected_report:
        with open(selected_report, 'r') as f:
            report_data = json.load(f)
    
    if report_data:
        # Display metadata
        st.subheader("📋 Report Information")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Input Source", report_data['metadata']['input_source'])
        with col2:
            st.metric("Frames Processed", report_data['metadata']['total_frames_processed'])
        with col3:
            timestamp = datetime.fromisoformat(report_data['metadata']['timestamp'])
            st.metric("Generated", timestamp.strftime('%Y-%m-%d %H:%M'))
        
        st.markdown("---")
        
        # Summary metrics
        st.subheader("📈 Summary Statistics")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Total Students",
                report_data['summary']['total_students_detected']
            )
        
        with col2:
            engagement = report_data['summary']['average_class_engagement']
            st.metric(
                "Avg. Engagement",
                f"{engagement:.2f}",
                delta=f"{(engagement - 0.5):.2f}" if engagement > 0.5 else f"{(engagement - 0.5):.2f}"
            )
        
        with col3:
            st.metric(
                "Highly Engaged",
                f"{report_data['summary']['average_highly_engaged']:.1f}",
                delta="Good" if report_data['summary']['average_highly_engaged'] > 10 else None
            )
        
        with col4:
            st.metric(
                "Disengaged",
                f"{report_data['summary']['average_disengaged']:.1f}",
                delta="Needs Attention" if report_data['summary']['average_disengaged'] > 5 else None,
                delta_color="inverse"
            )
        
        st.markdown("---")
        
        # Timeline visualization
        st.subheader("📉 Engagement Over Time")
        
        timeline_df = pd.DataFrame(report_data['timeline'])
        
        # Create engagement timeline chart
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=timeline_df['frame'],
            y=timeline_df['engagement'],
            mode='lines',
            name='Class Engagement',
            line=dict(color='#1f77b4', width=2),
            fill='tozeroy',
            fillcolor='rgba(31, 119, 180, 0.2)'
        ))
        
        fig.update_layout(
            title="Class Engagement Timeline",
            xaxis_title="Frame Number",
            yaxis_title="Engagement Score",
            yaxis_range=[0, 1],
            hovermode='x unified',
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Student count over time
        fig2 = go.Figure()
        
        fig2.add_trace(go.Scatter(
            x=timeline_df['frame'],
            y=timeline_df['students'],
            mode='lines',
            name='Students Detected',
            line=dict(color='#2ca02c', width=2)
        ))
        
        fig2.update_layout(
            title="Students Detected Over Time",
            xaxis_title="Frame Number",
            yaxis_title="Number of Students",
            hovermode='x unified',
            height=300
        )
        
        st.plotly_chart(fig2, use_container_width=True)
        
        # Engagement distribution
        st.subheader("📊 Engagement Distribution")
        
        # Create histogram
        fig3 = px.histogram(
            timeline_df,
            x='engagement',
            nbins=20,
            title="Distribution of Engagement Scores",
            labels={'engagement': 'Engagement Score', 'count': 'Frequency'},
            color_discrete_sequence=['#1f77b4']
        )
        
        fig3.update_layout(height=300)
        st.plotly_chart(fig3, use_container_width=True)
        
        # Download processed report
        st.markdown("---")
        st.subheader("💾 Export Data")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Download timeline as CSV
            csv = timeline_df.to_csv(index=False)
            st.download_button(
                label="Download Timeline CSV",
                data=csv,
                file_name="engagement_timeline.csv",
                mime="text/csv"
            )
        
        with col2:
            # Download full report
            st.download_button(
                label="Download Full Report JSON",
                data=json.dumps(report_data, indent=2),
                file_name="engagement_report.json",
                mime="application/json"
            )
    
    else:
        st.info("👆 Upload a report or select an existing one to view analysis")
        
        # Show sample workflow
        st.markdown("### 📝 How to Generate Reports")
        st.markdown("""
        1. **Process a video**:
        ```bash
        python scripts/run_inference.py --input path/to/classroom_video.mp4
        ```
        
        2. **Reports are automatically saved** to `outputs/reports/`
        
        3. **Upload or select the report** above to view detailed analysis
        """)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray; padding: 20px;'>
    <p>Student Engagement Monitoring System v1.0</p>
    <p>Built with ❤️ using MediaPipe, XGBoost, and Streamlit</p>
</div>
""", unsafe_allow_html=True)
