/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.field;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class FieldGroup {
    private final List<Property> groupedProperties;

    public FieldGroup(Property ... groupableFields) {
        this.groupedProperties = Arrays.asList(groupableFields);
        for (Property groupable : groupableFields) {
            groupable.setFieldGroup(this);
        }
    }

    public boolean ownsAllProps(Player owner) {
        return this.getOwnersPropsCount(owner) == this.groupedProperties.size();
    }

    public int getOwnersPropsCount(Player owner) {
        int[] counter = new int[]{0};
        this.groupedProperties.stream().filter(groupedProp -> groupedProp.getOwner() != null && groupedProp.getOwner().equals(owner)).filter(ownedProp -> !ownedProp.isMortgaged()).forEach(groupedProp -> {
            counter[0] = counter[0] + 1;
        });
        return counter[0];
    }

    public Collection<Property> getGroupedProperties() {
        return this.groupedProperties;
    }

    public List<Integer> getFieldIndices() {
        ArrayList<Integer> indices = new ArrayList<Integer>(this.groupedProperties.size());
        indices.addAll(this.groupedProperties.stream().map(Field::getPosition).collect(Collectors.toList()));
        return indices;
    }

    public String toString() {
        return this.getClass().getName() + "{" + "groupedProperties=" + this.groupedProperties + '}';
    }
}

