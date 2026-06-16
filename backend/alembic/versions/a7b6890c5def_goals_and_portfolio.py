"""goals and portfolio

Revision ID: a7b6890c5def
Revises: e0f7ef8a8f1b
Create Date: 2026-06-12 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a7b6890c5def'
down_revision: Union[str, None] = 'e0f7ef8a8f1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create goals table
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal_name', sa.String(length=150), nullable=False),
        sa.Column('goal_type', sa.Enum('retirement', 'home', 'education', 'travel', 'emergency', 'custom', name='goaltype'), nullable=False),
        sa.Column('target_amount', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('current_amount', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('monthly_contribution', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('active', 'paused', 'completed', name='goalstatus'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goals_id'), 'goals', ['id'], unique=False)
    op.create_index(op.f('ix_goals_user_id'), 'goals', ['user_id'], unique=False)

    # 2. Create investments table
    op.create_table(
        'investments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('asset_type', sa.Enum('stock', 'etf', 'mutual_fund', 'bond', 'cash', name='assettype'), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('asset_name', sa.String(length=150), nullable=False),
        sa.Column('units', sa.Numeric(precision=15, scale=6), nullable=False),
        sa.Column('avg_buy_price', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('cost_basis', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('current_value', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('last_price', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('allocation_percent', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('risk_level', sa.Enum('conservative', 'moderate', 'aggressive', name='riskprofile', create_type=False), nullable=False),
        sa.Column('last_price_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'symbol', name='uq_user_symbol')
    )
    op.create_index(op.f('ix_investments_id'), 'investments', ['id'], unique=False)
    op.create_index(op.f('ix_investments_user_id'), 'investments', ['user_id'], unique=False)
    op.create_index(op.f('ix_investments_symbol'), 'investments', ['symbol'], unique=False)

    # 3. Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('investment_id', sa.Integer(), nullable=True),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('type', sa.Enum('buy', 'sell', 'dividend', 'contribution', 'withdrawal', name='transactiontype'), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=15, scale=6), nullable=False),
        sa.Column('price', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('fees', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('executed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['investment_id'], ['investments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_transactions_investment_id'), 'transactions', ['investment_id'], unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_index(op.f('ix_transactions_investment_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_user_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_table('transactions')
    
    op.drop_index(op.f('ix_investments_symbol'), table_name='investments')
    op.drop_index(op.f('ix_investments_user_id'), table_name='investments')
    op.drop_index(op.f('ix_investments_id'), table_name='investments')
    op.drop_table('investments')
    
    op.drop_index(op.f('ix_goals_user_id'), table_name='goals')
    op.drop_index(op.f('ix_goals_id'), table_name='goals')
    op.drop_table('goals')

    # Drop Enums
    op.execute('DROP TYPE transactiontype')
    op.execute('DROP TYPE assettype')
    op.execute('DROP TYPE goalstatus')
    op.execute('DROP TYPE goaltype')
