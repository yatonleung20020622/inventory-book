-- RenameColumn
ALTER TABLE `Item` CHANGE `important_message` `notice` TEXT NOT NULL DEFAULT '';
