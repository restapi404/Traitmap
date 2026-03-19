from sqlalchemy import Column, Integer, String, Float, Text, TIMESTAMP, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    __tablename__ = "users"
    user_id         = Column(Integer, primary_key=True, autoincrement=True)
    username        = Column(String(100), nullable=False)
    email           = Column(String(150), unique=True, nullable=False)
    password_hash   = Column(String(255), nullable=False)
    age             = Column(Integer)
    education_level = Column(String(100))
    created_at      = Column(TIMESTAMP, server_default=func.now())
    mbti_profile    = relationship("MBTIProfile", back_populates="user", uselist=False)
    recommendations = relationship("Recommendation", back_populates="user")

class MBTIProfile(Base):
    __tablename__ = "mbti_profiles"
    mbti_id             = Column(Integer, primary_key=True, autoincrement=True)
    user_id             = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True)
    mbti_type           = Column(String(4))
    introversion_score  = Column(Float)
    extraversion_score  = Column(Float)
    sensing_score       = Column(Float)
    intuition_score     = Column(Float)
    thinking_score      = Column(Float)
    feeling_score       = Column(Float)
    judging_score       = Column(Float)
    perceiving_score    = Column(Float)
    computed_at         = Column(TIMESTAMP, server_default=func.now())
    user                = relationship("User", back_populates="mbti_profile")

class JobField(Base):
    __tablename__ = "job_fields"
    jobfield_id   = Column(Integer, primary_key=True, autoincrement=True)
    jobfield_name = Column(String(150), unique=True, nullable=False)
    description   = Column(Text)
    job_count     = Column(Integer, default=0)
    jobs          = relationship("Job", back_populates="job_field")

class Job(Base):
    __tablename__ = "job"
    job_id          = Column(Integer, primary_key=True, autoincrement=True)
    job_title       = Column(String(255), nullable=False)
    job_description = Column(Text)
    department      = Column(String(255))
    salary_max      = Column(Float)
    salary_min      = Column(Float)
    jobfield_id     = Column(Integer, ForeignKey("job_fields.jobfield_id", ondelete="SET NULL"))
    job_field       = relationship("JobField", back_populates="jobs")
    profiles        = relationship("JobProfile", back_populates="job")
    recommendations = relationship("Recommendation", back_populates="job")

class JobProfile(Base):
    __tablename__ = "job_profile"
    jobprofile_id          = Column(Integer, primary_key=True, autoincrement=True)
    job_id                 = Column(Integer, ForeignKey("job.job_id", ondelete="CASCADE"))
    jobfield_id            = Column(Integer, ForeignKey("job_fields.jobfield_id", ondelete="CASCADE"))
    mbti_type              = Column(String(10), nullable=False)
    compatibility_score    = Column(Float)
    fuzzy_normalised_score = Column(Float)
    weighted_scale_sum     = Column(Float)
    job                    = relationship("Job", back_populates="profiles")

class Recommendation(Base):
    __tablename__ = "recommendations"
    recommendation_id   = Column(Integer, primary_key=True, autoincrement=True)
    user_id             = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    job_id              = Column(Integer, ForeignKey("job.job_id", ondelete="CASCADE"))
    recommendation_type = Column(String(20), nullable=False)
    cbf_score           = Column(Float)
    cf_score            = Column(Float)
    final_score         = Column(Float, nullable=False)
    rank_position       = Column(Integer)
    user_feedback       = Column(String(255))
    created_at          = Column(TIMESTAMP, server_default=func.now())
    user                = relationship("User", back_populates="recommendations")
    job                 = relationship("Job", back_populates="recommendations")

class USER_JOB_INTERACTION(Base):
    __tablename__ = "USER_JOB_INTERACTION"
    user_id               = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    jobfield_id           = Column(Integer, ForeignKey("job_fields.jobfield_id", ondelete="CASCADE"), primary_key=True)
    interaction_type      = Column(String(50), nullable=False)
    satisfied             = Column(SmallInteger, default=0)
    interaction_timestamp = Column(TIMESTAMP, primary_key=True, server_default=func.now())