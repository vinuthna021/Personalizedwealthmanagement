"""milestone3_market_data

Revision ID: 86644911451a
Revises: a7b6890c5def
Create Date: 2026-06-16 14:27:24.781087

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '86644911451a'
down_revision: Union[str, None] = 'a7b6890c5def'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update investments table
    op.alter_column('investments', 'symbol', new_column_name='ticker_symbol')
    op.alter_column('investments', 'asset_type', new_column_name='asset_class')
    op.alter_column('investments', 'units', new_column_name='quantity')
    op.alter_column('investments', 'avg_buy_price', new_column_name='average_cost')
    
    op.add_column('investments', sa.Column('exchange', sa.String(length=50), nullable=True))
    op.add_column('investments', sa.Column('data_provider', sa.String(length=50), nullable=True))
    
    # Update unique constraint
    op.drop_constraint('uq_user_symbol', 'investments', type_='unique')
    op.create_unique_constraint('uq_user_ticker_symbol', 'investments', ['user_id', 'ticker_symbol'])
    
    # Update index
    op.drop_index('ix_investments_symbol', table_name='investments')
    op.create_index(op.f('ix_investments_ticker_symbol'), 'investments', ['ticker_symbol'], unique=False)

    # 2. Create simulations table
    op.create_table(
        'simulations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=True),
        sa.Column('scenario_name', sa.String(length=150), nullable=False),
        sa.Column('simulation_type', sa.String(length=50), nullable=False),
        sa.Column('input_parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('result_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_simulations_id'), 'simulations', ['id'], unique=False)
    op.create_index(op.f('ix_simulations_user_id'), 'simulations', ['user_id'], unique=False)
    op.create_index(op.f('ix_simulations_goal_id'), 'simulations', ['goal_id'], unique=False)


def downgrade() -> None:
    # 1. Drop simulations table
    op.drop_index(op.f('ix_simulations_goal_id'), table_name='simulations')
    op.drop_index(op.f('ix_simulations_user_id'), table_name='simulations')
    op.drop_index(op.f('ix_simulations_id'), table_name='simulations')
    op.drop_table('simulations')

    # 2. Revert investments table
    # Drop new index and unique constraint first
    op.drop_index(op.f('ix_investments_ticker_symbol'), table_name='investments')
    op.drop_constraint('uq_user_ticker_symbol', 'investments', type_='unique')
    
    # Drop new columns
    op.drop_column('investments', 'data_provider')
    op.drop_column('investments', 'exchange')
    
    # Rename columns back
    op.alter_column('investments', 'average_cost', new_column_name='avg_buy_price')
    op.alter_column('investments', 'quantity', new_column_name='units')
    op.alter_column('investments', 'asset_class', new_column_name='asset_type')
    op.alter_column('investments', 'ticker_symbol', new_column_name='symbol')
    
    # Recreate old unique constraint and index
    op.create_unique_constraint('uq_user_symbol', 'investments', ['user_id', 'symbol'])
    op.create_index('ix_investments_symbol', 'investments', ['symbol'], unique=False)

