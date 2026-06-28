package de.hhn.labsw.laspoly.utils;

import javafx.beans.property.StringPropertyBase;

import java.io.Externalizable;
import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectOutput;

/**
 * Implementation of {@link javafx.beans.property.SimpleStringProperty} to make it serializable.
 */
public class SerializableStringProperty extends StringPropertyBase implements Externalizable {

    /**
     * Default value for {@link #bean}.
     */
    private static final Object DEFAULT_BEAN = null;
    /**
     * Default value for {@link #name}.
     */
    private static final String DEFAULT_NAME = "";

    private final Object bean;
    private final String name;

    /**
     * Basic constructor.
     */
    public SerializableStringProperty() {
        this(DEFAULT_BEAN, DEFAULT_NAME);
    }

    /**
     * Constructor of {@link javafx.beans.property.SimpleStringProperty}.
     *
     * @param initialValue The initial value of the wrapped value.
     */
    public SerializableStringProperty(String initialValue) {
        this(DEFAULT_BEAN, DEFAULT_NAME, initialValue);
    }

    /**
     * Constructor of {@link javafx.beans.property.SimpleStringProperty}.
     * @param bean The bean of this {@code StringProperty}
     * @param name The name of this {@code StringProperty}
     */
    public SerializableStringProperty(Object bean, String name) {
        this.bean = bean;
        this.name = (name == null) ? DEFAULT_NAME : name;
    }

    /**
     * Constructor of {@link javafx.beans.property.SimpleStringProperty}.
     * @param bean The bean of this {@code StringProperty}
     * @param name The name of this {@code StringProperty}
     * @param initialValue The initial value of the wrapped value.
     */
    public SerializableStringProperty(Object bean, String name, String initialValue) {
        super(initialValue);
        this.bean = bean;
        this.name = (name == null) ? DEFAULT_NAME : name;
    }

    @Override
    public void writeExternal(ObjectOutput out) throws IOException {
        out.writeObject(getValue());
    }

    @Override
    public void readExternal(ObjectInput in) throws IOException, ClassNotFoundException {
        set((String) in.readObject());
    }

    @Override
    public Object getBean() {
        return bean;
    }

    @Override
    public String getName() {
        return name;
    }
}
