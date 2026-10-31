-- Undoes 177_ui_control_shift_board_nav.sql. Shift Board was merged into
-- /production/recording (ShiftBoardSection.jsx) instead of staying a
-- separate sidebar tab (Rahul: two places to log production numbers was
-- duplication). Removes the now-dead "Shift Board" sidebar row; any
-- ui_control_overrides row pointing at it cascades away via the FK
-- (onDelete: Cascade), so nothing orphaned is left behind.
DELETE FROM ui_control_elements
WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
  AND key = 'sidebar.production.shiftBoard';
