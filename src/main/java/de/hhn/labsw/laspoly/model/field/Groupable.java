package de.hhn.labsw.laspoly.model.field;
/**
 * A  group is a fixed group of 1..4 streets that belong together.
 * A  groupable class is grouped together in the {@link FieldGroup}
 */
public interface Groupable {
    public FieldGroup getFieldGroup();
    public void setFieldGroup(FieldGroup colourGroup);
}
