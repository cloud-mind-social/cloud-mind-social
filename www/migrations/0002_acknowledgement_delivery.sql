-- Record whether the acknowledgement email actually went out.
--
-- inquiry_replies has carried `delivery`/`error` since 0001, so a reply that
-- failed says so in the inbox. The acknowledgement the form sends had no such
-- record: a failed send was a console.error in the Worker logs and nothing
-- else, so the inbox showed an inquiry that looked fully handled while the
-- person who filled in the form had heard nothing.
--
-- NULL means "sent before this column existed" — unknown, not failed.
ALTER TABLE inquiries ADD COLUMN ack_delivery TEXT;
ALTER TABLE inquiries ADD COLUMN ack_error    TEXT;
