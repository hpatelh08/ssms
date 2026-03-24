"""
AI-Powered Content Generator for Smart School Management System
Generates intelligent, personalized content for all dashboard sections
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

class AIContentGenerator:
    """Generates AI-powered educational content and insights"""
    
    def __init__(self):
        self.subjects = ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi']
        self.behavior_types = ['excellent', 'good', 'average', 'needs_improvement']
        self.performance_levels = ['outstanding', 'excellent', 'good', 'average', 'below_average']
        
    def generate_student_insights(self, student_data: Dict) -> List[str]:
        """Generate AI-powered insights for student performance"""
        insights = []
        
        # Academic Performance Insights
        if student_data.get('avg_percentage', 0) > 85:
            insights.append("🌟 Outstanding Academic Performance - Consistently excelling across subjects")
            insights.append("🎯 Recommended: Advanced learning opportunities and enrichment programs")
        elif student_data.get('avg_percentage', 0) > 75:
            insights.append("✅ Strong Academic Foundation - Maintaining good performance levels")
            insights.append("📈 Suggested: Focus on challenging areas to achieve excellence")
        elif student_data.get('avg_percentage', 0) > 60:
            insights.append("⚠️ Average Performance - Room for improvement in key areas")
            insights.append("📚 Recommended: Additional tutoring and focused study sessions")
        else:
            insights.append("🔴 Academic Concern - Requires immediate intervention and support")
            insights.append("🆘 Suggested: Personalized learning plan with regular monitoring")
        
        # Attendance Insights
        attendance_rate = student_data.get('attendance_rate', 0)
        if attendance_rate > 95:
            insights.append("🏆 Perfect Attendance Record - Demonstrates excellent discipline")
        elif attendance_rate > 90:
            insights.append("👍 Good Attendance - Maintaining consistent school presence")
        elif attendance_rate > 80:
            insights.append("⚠️ Attendance Needs Improvement - Regular attendance is crucial")
        else:
            insights.append("🔴 Poor Attendance - Immediate action required to improve presence")
        
        # Subject-wise Recommendations
        weak_subjects = student_data.get('weak_subjects', [])
        if weak_subjects:
            insights.append(f"📚 Focus Areas: {', '.join(weak_subjects[:2])} need extra attention")
            insights.append("💡 Suggested: Subject-specific tutoring and additional practice")
        
        return insights
    
    def generate_behavior_analysis(self, behavior_data: Dict) -> Dict[str, Any]:
        """Generate comprehensive behavior analysis with AI insights"""
        good_count = behavior_data.get('good_incidents', 0)
        bad_count = behavior_data.get('bad_incidents', 0)
        total_count = behavior_data.get('total_incidents', 0)
        
        # AI Behavior Scoring
        behavior_score = round((good_count / max(total_count, 1)) * 100, 2)
        
        # Generate Insights
        insights = []
        recommendations = []
        
        if behavior_score >= 90:
            insights.append("🌟 Exceptional Behavioral Record")
            insights.append("Student consistently demonstrates positive conduct and leadership qualities")
            recommendations.append("Consider for student leadership positions")
            recommendations.append("Nominate for character awards and recognition programs")
        elif behavior_score >= 75:
            insights.append("✅ Good Behavioral Standing")
            insights.append("Student maintains positive behavior with occasional areas for growth")
            recommendations.append("Continue positive reinforcement strategies")
            recommendations.append("Encourage participation in character-building activities")
        elif behavior_score >= 60:
            insights.append("⚠️ Moderate Behavioral Performance")
            insights.append("Student shows mixed behavior patterns requiring guidance")
            recommendations.append("Implement behavior improvement plan")
            recommendations.append("Regular check-ins with school counselor")
        else:
            insights.append("🔴 Behavioral Concerns Identified")
            insights.append("Student requires significant behavioral intervention and support")
            recommendations.append("Immediate counseling and behavior modification program")
            recommendations.append("Parent-teacher conference to discuss strategies")
        
        # Trend Analysis
        trend_analysis = {
            'current_status': 'excellent' if behavior_score >= 80 else ('good' if behavior_score >= 60 else 'concern'),
            'improvement_needed': bad_count > good_count,
            'stability': abs(good_count - bad_count) <= 2
        }
        
        return {
            'behavior_score': behavior_score,
            'insights': insights,
            'recommendations': recommendations,
            'trend_analysis': trend_analysis
        }
    
    def generate_exam_preparation_guide(self, subject: str, difficulty: str = 'medium') -> Dict[str, Any]:
        """Generate AI-powered exam preparation guides"""
        study_guides = {
            'Mathematics': {
                'topics': ['Algebra', 'Geometry', 'Statistics', 'Calculus Basics'],
                'study_hours': {'easy': 10, 'medium': 15, 'hard': 20},
                'resources': ['NCERT Textbook', 'RD Sharma', 'Online Practice Tests'],
                'tips': [
                    'Practice daily with variety of problems',
                    'Focus on understanding concepts rather than memorization',
                    'Solve previous year question papers',
                    'Create formula sheets for quick revision'
                ]
            },
            'Science': {
                'topics': ['Physics Fundamentals', 'Chemistry Reactions', 'Biology Systems'],
                'study_hours': {'easy': 12, 'medium': 18, 'hard': 25},
                'resources': ['NCERT Science', 'Lab Manuals', 'Educational Videos'],
                'tips': [
                    'Understand scientific principles through experiments',
                    'Make detailed notes with diagrams',
                    'Practice numerical problems regularly',
                    'Revise important chemical equations and reactions'
                ]
            },
            'English': {
                'topics': ['Grammar', 'Literature', 'Writing Skills', 'Comprehension'],
                'study_hours': {'easy': 8, 'medium': 12, 'hard': 16},
                'resources': ['NCERT English', 'Grammar Books', 'Literature Guides'],
                'tips': [
                    'Read extensively to improve comprehension',
                    'Practice writing essays and letters daily',
                    'Learn grammar rules with examples',
                    'Discuss literature themes with teachers'
                ]
            }
        }
        
        guide = study_guides.get(subject, study_guides['Mathematics'])
        
        return {
            'subject': subject,
            'recommended_study_hours': guide['study_hours'].get(difficulty, 15),
            'key_topics': guide['topics'],
            'study_resources': guide['resources'],
            'ai_tips': guide['tips'],
            'personalized_plan': self._generate_personalized_plan(subject, difficulty)
        }
    
    def _generate_personalized_plan(self, subject: str, difficulty: str) -> List[str]:
        """Generate personalized study plan"""
        plans = {
            'easy': [
                f"Week 1-2: Focus on {subject} fundamentals and basic concepts",
                "Week 3-4: Practice simple problems and exercises",
                "Week 5: Revision and mock tests"
            ],
            'medium': [
                f"Week 1: Master {subject} core concepts and theories",
                "Week 2-3: Intensive problem-solving practice",
                "Week 4: Advanced topics and challenging problems",
                "Week 5: Comprehensive revision and practice tests"
            ],
            'hard': [
                f"Week 1-2: Deep dive into {subject} complex theories",
                "Week 3: Advanced problem-solving techniques",
                "Week 4: Exam pattern analysis and strategy",
                "Week 5-6: Intensive practice and weak area improvement",
                "Week 7: Final revision and confidence building"
            ]
        }
        
        return plans.get(difficulty, plans['medium'])
    
    def generate_homework_feedback(self, subject: str, completion_status: str) -> Dict[str, Any]:
        """Generate AI-powered homework feedback"""
        feedback_templates = {
            'excellent': {
                'comment': f"Outstanding work in {subject}! Your homework shows exceptional understanding and effort.",
                'strengths': ['Thorough completion', 'Clear presentation', 'Correct methodology'],
                'next_steps': ['Attempt advanced problems', 'Help classmates with difficult concepts']
            },
            'good': {
                'comment': f"Good job on your {subject} homework. You've demonstrated solid understanding.",
                'strengths': ['Complete work', 'Most answers correct', 'Decent presentation'],
                'next_steps': ['Review incorrect answers', 'Practice more challenging problems']
            },
            'average': {
                'comment': f"Your {subject} homework shows basic understanding but needs improvement.",
                'strengths': ['Attempted most questions', 'Some correct answers'],
                'next_steps': ['Focus on weak areas', 'Seek help for difficult concepts', 'More practice needed']
            },
            'poor': {
                'comment': f"Your {subject} homework requires significant improvement and attention.",
                'strengths': ['Made an attempt'],
                'next_steps': ['Immediate tutoring required', 'Parent-teacher meeting', 'Daily practice sessions']
            }
        }
        
        return feedback_templates.get(completion_status, feedback_templates['average'])
    
    def generate_parent_communication_templates(self) -> Dict[str, List[str]]:
        """Generate AI-powered parent communication templates"""
        return {
            'academic_progress': [
                "We're pleased to report that {student_name} is making good progress in {subject}.",
                "{student_name} has shown improvement in {specific_area} this term.",
                "We recommend additional support in {weak_subject} for {student_name}."
            ],
            'behavioral_updates': [
                "{student_name} has demonstrated excellent behavior and leadership qualities.",
                "We've noticed some behavioral concerns with {student_name} that need attention.",
                "{student_name} is making positive strides in character development."
            ],
            'attendance_reminders': [
                "Regular attendance is crucial for {student_name}'s academic success.",
                "We're concerned about {student_name}'s recent attendance pattern.",
                "{student_name} maintains excellent attendance - keep up the good work!"
            ]
        }

# Global instance
ai_generator = AIContentGenerator()