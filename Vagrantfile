# -*- mode: ruby -*-
# vi: set ft=ruby :

# ============================================
# Vagrantfile — Biblioteca API
# ============================================
# Define duas máquinas virtuais (VirtualBox):
#   - vm1: Máquina cliente (para testes HTTP com curl)
#   - vm2: Máquina servidora (executa a Biblioteca API)
#
# Rede privada Classe C: 192.168.56.0/24
# ============================================

Vagrant.configure("2") do |config|

  # ============================================
  # Box base para ambas as VMs
  # ============================================
  config.vm.box = "ubuntu/jammy64"

  # ============================================
  # VM1 — Máquina Cliente
  # ============================================
  config.vm.define "vm1" do |vm1|
    vm1.vm.hostname = "vm1-cliente"

    # Rede privada — Classe C
    vm1.vm.network "private_network", ip: "192.168.56.10"

    # Configurações do VirtualBox
    vm1.vm.provider "virtualbox" do |vb|
      vb.name   = "Biblioteca-API-VM1-Cliente"
      vb.memory = 1024
      vb.cpus   = 1
      vb.gui    = false
    end

    # Provisionamento da VM1
    vm1.vm.provision "shell", path: "vagrant/provision-vm1.sh"
  end

  # ============================================
  # VM2 — Máquina Servidora
  # ============================================
  config.vm.define "vm2" do |vm2|
    vm2.vm.hostname = "vm2-servidor"

    # Rede privada — Classe C (mesma sub-rede da VM1)
    vm2.vm.network "private_network", ip: "192.168.56.11"

    # Compartilhamento da pasta do projeto no host com a VM2
    # A pasta raiz do projeto será montada em /vagrant_data dentro da VM
    vm2.vm.synced_folder ".", "/vagrant_data", type: "virtualbox",
      owner: "vagrant",
      group: "vagrant",
      mount_options: ["dmode=775", "fmode=664"]

    # Configurações do VirtualBox
    vm2.vm.provider "virtualbox" do |vb|
      vb.name   = "Biblioteca-API-VM2-Servidor"
      vb.memory = 1024
      vb.cpus   = 1
      vb.gui    = false
    end

    # Provisionamento da VM2
    vm2.vm.provision "shell", path: "vagrant/provision-vm2.sh"
  end

end

