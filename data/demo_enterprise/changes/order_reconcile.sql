-- Stored procedure: order_reconcile
-- Matches captured orders to settled payments for the prior day.
-- WARNING: written against MySQL 5.7 sql_mode (no ONLY_FULL_GROUP_BY).

DELIMITER //

CREATE PROCEDURE order_reconcile(IN p_business_date DATE)
BEGIN
    -- Relies on implicit GROUP BY ordering and selects non-aggregated columns
    -- that are not in the GROUP BY clause. Both behaviors change in MySQL 8.0.
    SELECT
        o.customer_id,
        o.order_id,                      -- not in GROUP BY → ONLY_FULL_GROUP_BY error in 8.0
        o.status,                        -- not in GROUP BY
        SUM(p.amount)        AS settled_amount,
        COUNT(*)             AS payment_count
    FROM orders o
    JOIN payments p ON p.order_id = o.order_id
    WHERE DATE(o.created_at) = p_business_date
    GROUP BY o.customer_id               -- implicit ordering relied on downstream
    ORDER BY NULL;                        -- 5.7 optimization; semantics differ in 8.0

    -- Charset note: orders is latin1, payments is utf8mb4.
    -- The JOIN above can raise "Illegal mix of collations" under stricter 8.0 rules.
END //

DELIMITER ;
